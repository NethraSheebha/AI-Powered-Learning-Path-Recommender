from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.graph import Node, Graph, Edge
from app.models.learner import Learner
from app.models.evidence import EvidenceEvent
from app.schemas.evidence import (
    QuizRequest,
    QuizResponse,
    ProjectSubmitRequest,
    ProjectSubmitResponse,
)

PASS_RATIO = 0.70


def grade_quiz_answers(quiz_questions, answers) -> tuple:
    """Compare selected_option_index to correct_option_index. Pass if >= 70% correct."""
    questions = quiz_questions or []
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This node has no quiz questions to grade.",
        )

    by_id = {q.get("id"): q for q in questions if isinstance(q, dict) and q.get("id")}
    selected = {item.question_id: item.selected_option_index for item in answers}

    correct_count = 0
    for qid, question in by_id.items():
        expected = question.get("correct_option_index")
        if qid in selected and selected[qid] == expected:
            correct_count += 1

    total = len(by_id)
    ratio = (correct_count / total) if total else 0.0
    passed = ratio >= PASS_RATIO
    return passed, ratio


from app.mocks.mock_data import get_mock_node_detail
from app.services.mastery_engine import update_mastery, get_mastery_threshold
from app.services.unlock_engine import propagate_unlocks

router = APIRouter(prefix="", tags=["Assessments & Evidence"])

@router.post("/quiz/{node_id}", response_model=QuizResponse, status_code=status.HTTP_200_OK)
def submit_quiz(node_id: str, payload: QuizRequest, db: Session = Depends(get_db)):
    """
    Submits quiz answers for a specific node, applies Real Bayesian Knowledge Tracing (BKT)
    to update node mastery (p_mastery), logs an EvidenceEvent, and triggers graph unlock
    propagation if the node crosses the mastery threshold.
    """
    newly_unlocked: List[str] = []

    db_node = None
    try:
        db_node = db.query(Node).filter(Node.id == node_id).first()
    except Exception:
        db_node = None

    if db_node:
        if db_node.status == "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit assessment for locked node '{node_id}'. Master prerequisite nodes first to unlock."
            )

        correct, raw_score = grade_quiz_answers(db_node.quiz_questions, payload.answers)

        try:
            # Save Evidence Event log
            event = EvidenceEvent(
                node_id=db_node.id,
                learner_id=payload.learner_id,
                type="quiz",
                raw_score=raw_score,
                correct=correct,
                created_at=datetime.now(timezone.utc)
            )
            db.add(event)

            # Apply BKT update
            updated_p_mastery = update_mastery(db_node, correct=correct)
            threshold = get_mastery_threshold()

            if updated_p_mastery >= threshold:
                db_node.status = "mastered"
                db.flush()
                # Propagate prerequisite unlocks downstream
                newly_unlocked = propagate_unlocks(db_node.graph_id, db_node.id, db)
            
            db.add(db_node)
            db.commit()
            db.refresh(db_node)
        except HTTPException:
            db.rollback()
            raise
        except Exception as err:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during quiz submission: {str(err)}"
            )

        current_status = db_node.status
        final_p_mastery = db_node.p_mastery
    else:
        mock_raw = get_mock_node_detail(node_id)
        mock_obj = type("MockNode", (), mock_raw)()

        if getattr(mock_obj, "status", "available") == "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit assessment for locked node '{node_id}'. Master prerequisite nodes first to unlock."
            )

        correct, raw_score = grade_quiz_answers(mock_raw.get("quiz_questions"), payload.answers)
        final_p_mastery = update_mastery(mock_obj, correct=correct)
        threshold = get_mastery_threshold()
        current_status = "mastered" if final_p_mastery >= threshold else getattr(mock_obj, "status", "available")

    return {
        "node_id": node_id,
        "learner_id": payload.learner_id,
        "raw_score": raw_score,
        "correct": correct,
        "status": current_status,
        "p_mastery": final_p_mastery,
        "newly_unlocked": newly_unlocked,
        "updated_at": datetime.now(timezone.utc)
    }

from app.services.rubric_interface import score_submission_against_rubric
from app.services.mutation_interface import trigger_remedial_mutation

@router.post("/submit-project/{node_id}", response_model=ProjectSubmitResponse, status_code=status.HTTP_200_OK)
def submit_project(node_id: str, payload: ProjectSubmitRequest, db: Session = Depends(get_db)):
    """
    Submits a project repository or artifact for grading against the node's rubric via the
    Rubric Interface (Member 3 stub), logs an EvidenceEvent, applies BKT update_mastery(),
    and triggers a Remedial Graph Mutation (Member 4 stub) if the learner fails the threshold multiple times.
    """
    # 1. Fetch live DB node if available
    db_node = None
    try:
        db_node = db.query(Node).filter(Node.id == node_id).first()
    except Exception:
        db_node = None

    target_node = db_node if db_node else get_mock_node_detail(node_id)

    # 2. Evaluate submission using Rubric Interface (Member 3 stub)
    rubric_res = score_submission_against_rubric(target_node, payload.submission)
    correct = rubric_res.meets_threshold
    raw_score = rubric_res.overall_score

    graph_diff_payload = None

    if db_node:
        # HARDENING: Reject assessment submission on locked nodes
        if db_node.status == "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit assessment for locked node '{node_id}'. Master prerequisite nodes first to unlock."
            )

        try:
            # 3. Save Evidence Event record
            event = EvidenceEvent(
                node_id=db_node.id,
                learner_id=payload.learner_id,
                type="project",
                raw_score=raw_score,
                correct=correct,
                rubric_result=[c.model_dump() for c in rubric_res.criteria_results],
                created_at=datetime.now(timezone.utc)
            )
            db.add(event)
            db.flush()

            # 4. Apply BKT update
            updated_p_mastery = update_mastery(db_node, correct=correct)
            threshold = get_mastery_threshold()

            if updated_p_mastery >= threshold and correct:
                db_node.status = "mastered"
                db.flush()
                propagate_unlocks(db_node.graph_id, db_node.id, db)

            # 5. Check failed attempt count for Remedial Graph Mutation trigger
            if not correct:
                failed_count = db.query(EvidenceEvent).filter(
                    EvidenceEvent.node_id == db_node.id,
                    EvidenceEvent.learner_id == payload.learner_id,
                    EvidenceEvent.correct == False
                ).count()

                if failed_count >= 2:
                    failed_criteria = [c.criterion for c in rubric_res.criteria_results if not c.passed]
                    diff = trigger_remedial_mutation(
                        graph_id=db_node.graph_id,
                        node_id=db_node.id,
                        failed_criteria=failed_criteria,
                        db=db,
                        trigger_event_id=event.id
                    )
                    graph_diff_payload = {
                        "id": diff.id,
                        "graph_id": diff.graph_id,
                        "trigger_event_id": diff.trigger_event_id,
                        "nodes_added": diff.nodes_added,
                        "edges_added": diff.edges_added,
                        "created_at": diff.created_at
                    }

            db.add(db_node)
            db.commit()
            db.refresh(db_node)
        except HTTPException:
            db.rollback()
            raise
        except Exception as err:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transaction failed during project submission: {str(err)}"
            )

        current_status = db_node.status
        final_p_mastery = db_node.p_mastery
    else:
        # Fallback / In-Memory Mock Node for Phase 1 compatibility
        mock_raw = get_mock_node_detail(node_id)
        mock_obj = type("MockNode", (), mock_raw)()

        if getattr(mock_obj, "status", "available") == "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit assessment for locked node '{node_id}'. Master prerequisite nodes first to unlock."
            )

        final_p_mastery = update_mastery(mock_obj, correct=correct)
        threshold = get_mastery_threshold()
        current_status = "mastered" if final_p_mastery >= threshold and correct else getattr(mock_obj, "status", "available")

    rubric_results_dict = [c.model_dump() for c in rubric_res.criteria_results]

    return {
        "node_id": node_id,
        "learner_id": payload.learner_id,
        "status": current_status,
        "p_mastery": final_p_mastery,
        "raw_score": raw_score,
        "rubric_result": rubric_results_dict,
        "graph_diff": graph_diff_payload,
        "updated_at": datetime.now(timezone.utc)
    }
