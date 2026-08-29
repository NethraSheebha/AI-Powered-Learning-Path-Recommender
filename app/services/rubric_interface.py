from typing import List, Dict, Any
from pydantic import BaseModel, Field

class RubricCriterionResult(BaseModel):
    criterion: str
    passed: bool

class RubricResult(BaseModel):
    overall_score: float = Field(..., example=0.90)
    criteria_results: List[RubricCriterionResult]
    meets_threshold: bool = Field(..., example=True)

# STUB: Member 3 will replace internals only, do not change signature
def score_submission_against_rubric(node: Any, submission: Dict[str, Any]) -> RubricResult:
    """
    Evaluates a learner project submission against a node's grading rubric.

    ================================================================================
    # STUB: Member 3 will replace internals only, do not change signature
    ================================================================================
    Currently returns a static/deterministic mock RubricResult.
    Will be replaced by Member 3 with a real Gemini LLM rubric grading pipeline.
    """
    submission_dict = submission or {}
    
    # Check if submission contains explicit mock failure instruction
    is_failing = (
        submission_dict.get("fail") is True
        or submission_dict.get("pass") is False
        or (isinstance(submission_dict.get("score"), (int, float)) and submission_dict.get("score") < 0.70)
    )

    if is_failing:
        return RubricResult(
            overall_score=0.45,
            criteria_results=[
                RubricCriterionResult(criterion="Core Architecture & Modularity", passed=False),
                RubricCriterionResult(criterion="Error Handling & Edge Cases", passed=False),
                RubricCriterionResult(criterion="Code Formatting & Style", passed=True),
            ],
            meets_threshold=False,
        )

    return RubricResult(
        overall_score=0.90,
        criteria_results=[
            RubricCriterionResult(criterion="Core Architecture & Modularity", passed=True),
            RubricCriterionResult(criterion="Error Handling & Edge Cases", passed=True),
            RubricCriterionResult(criterion="Code Formatting & Style", passed=True),
        ],
        meets_threshold=True,
    )
