import pytest

from explanation_engine import generate_explanation


class FakeLLM:
    def __init__(self, response: str):
        self.response = response

    def generate(self, prompt: str) -> str:
        self.prompt = prompt
        return self.response


def test_generates_explanation_from_mocked_llm() -> None:
    llm = FakeLLM("A loop repeats a task until its condition changes.")
    result = generate_explanation("loops", "Python beginner course", llm)
    assert result.startswith("A loop")
    assert "loops" in llm.prompt


def test_rejects_empty_concept() -> None:
    with pytest.raises(ValueError, match="concept"):
        generate_explanation("", "context", FakeLLM("unused"))


def test_rejects_empty_llm_explanation() -> None:
    with pytest.raises(ValueError, match="empty explanation"):
        generate_explanation("loops", "context", FakeLLM("   "))
