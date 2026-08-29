"""LLM-assisted rubric evaluation with strict response validation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from llm_service import LLMClient


class RubricValidationError(ValueError):
    """Raised when the evaluation response is incomplete or malformed."""


def evaluate_submission(submission: str, rubric: str, llm: LLMClient) -> dict[str, Any]:
    """Evaluate a non-empty submission against a non-empty rubric."""
    if not submission.strip() or not rubric.strip():
        raise ValueError("submission and rubric must not be empty")
    prompt = _load_prompt().replace("{{submission}}", submission.strip()).replace("{{rubric}}", rubric.strip())
    try:
        result = json.loads(_strip_fence(llm.generate(prompt)))
    except json.JSONDecodeError as exc:
        raise RubricValidationError("LLM response was not valid JSON") from exc
    return validate_evaluation(result)


def validate_evaluation(evaluation: Any) -> dict[str, Any]:
    """Validate the structured evaluation contract without inventing missing data."""
    if not isinstance(evaluation, dict):
        raise RubricValidationError("evaluation must be an object")
    score = evaluation.get("score")
    if not isinstance(score, (int, float)) or isinstance(score, bool):
        raise RubricValidationError("evaluation score must be numeric")
    if not isinstance(evaluation.get("feedback"), str) or not evaluation["feedback"].strip():
        raise RubricValidationError("evaluation feedback must be a non-empty string")
    for field in ("strengths", "weaknesses", "missing_concepts"):
        value = evaluation.get(field)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise RubricValidationError(f"evaluation {field} must be a list of strings")
    return evaluation


def _strip_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    return text


def _load_prompt() -> str:
    return (Path(__file__).parent / "prompts" / "rubric_prompt.txt").read_text(encoding="utf-8")
