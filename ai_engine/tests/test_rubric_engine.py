import pytest

from rubric_engine import RubricValidationError, evaluate_submission, validate_evaluation


class FakeLLM:
    def __init__(self, response: str):
        self.response = response

    def generate(self, prompt: str) -> str:
        self.prompt = prompt
        return self.response


def test_evaluates_submission_from_mocked_llm() -> None:
    llm = FakeLLM('```json\n{"score":8,"strengths":["clear thesis"],"weaknesses":[],"missing_concepts":["citation"],"feedback":"Add a source."}\n```')
    result = evaluate_submission("An answer", "Score clarity", llm)
    assert result["score"] == 8
    assert "An answer" in llm.prompt


def test_rejects_missing_evaluation_data() -> None:
    with pytest.raises(RubricValidationError, match="feedback"):
        validate_evaluation({"score": 3, "strengths": [], "weaknesses": [], "missing_concepts": []})


def test_rejects_non_json_response() -> None:
    with pytest.raises(RubricValidationError, match="valid JSON"):
        evaluate_submission("answer", "rubric", FakeLLM("Score: 3"))


def test_rejects_non_numeric_score() -> None:
    evaluation = {"score": "eight", "strengths": [], "weaknesses": [], "missing_concepts": [], "feedback": "Feedback."}
    with pytest.raises(RubricValidationError, match="score must be numeric"):
        validate_evaluation(evaluation)


def test_rejects_boolean_score() -> None:
    evaluation = {"score": True, "strengths": [], "weaknesses": [], "missing_concepts": [], "feedback": "Feedback."}
    with pytest.raises(RubricValidationError, match="score must be numeric"):
        validate_evaluation(evaluation)


def test_rejects_strengths_that_are_not_list_of_strings() -> None:
    evaluation = {"score": 3, "strengths": "clear thesis", "weaknesses": [], "missing_concepts": [], "feedback": "Feedback."}
    with pytest.raises(RubricValidationError, match="strengths must be a list of strings"):
        validate_evaluation(evaluation)


def test_rejects_weaknesses_that_are_not_list_of_strings() -> None:
    evaluation = {"score": 3, "strengths": [], "weaknesses": ["missing detail", 1], "missing_concepts": [], "feedback": "Feedback."}
    with pytest.raises(RubricValidationError, match="weaknesses must be a list of strings"):
        validate_evaluation(evaluation)


def test_rejects_missing_concepts_that_are_not_list_of_strings() -> None:
    evaluation = {"score": 3, "strengths": [], "weaknesses": [], "missing_concepts": {"concept": "citation"}, "feedback": "Feedback."}
    with pytest.raises(RubricValidationError, match="missing_concepts must be a list of strings"):
        validate_evaluation(evaluation)
