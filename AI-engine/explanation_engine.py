"""Student-facing explanations, kept separate from assessment logic."""

from __future__ import annotations

from pathlib import Path

from llm_service import LLMClient


def generate_explanation(concept: str, context: str, llm: LLMClient) -> str:
    """Generate a clear learner-friendly explanation for a concept in context."""
    if not concept.strip():
        raise ValueError("concept must not be empty")
    prompt = (
        _load_prompt()
        .replace("{{concept}}", concept.strip())
        .replace("{{context}}", context.strip() or "No additional context was provided.")
    )
    explanation = llm.generate(prompt).strip()
    if not explanation:
        raise ValueError("LLM returned an empty explanation")
    return explanation


def _load_prompt() -> str:
    return (Path(__file__).parent / "prompts" / "explanation_prompt.txt").read_text(encoding="utf-8")
