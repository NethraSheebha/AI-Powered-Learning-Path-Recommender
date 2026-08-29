"""Provider-isolated access to Gemini."""

from __future__ import annotations

import os
from typing import Any, Protocol


class LLMError(RuntimeError):
    """Raised when an LLM request cannot be completed safely."""


class LLMClient(Protocol):
    """Minimal interface consumed by the domain engines."""

    def generate(self, prompt: str) -> str:
        """Return generated text for *prompt*."""


class GeminiLLMService:
    """Small Gemini implementation of :class:`LLMClient`.

    The API key is read only from ``GEMINI_API_KEY`` unless explicitly supplied
    by deployment configuration. Domain modules depend on ``LLMClient``, not
    on this provider-specific class.
    """

    def __init__(
        self,
        model: str = "gemini-3.6-flash",
        api_key: str | None = None,
        client: Any | None = None,
    ) -> None:
        self.model = model
        self._api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._client = client

    def generate(self, prompt: str) -> str:
        """Send a prompt to Gemini and return its non-empty text response."""
        if not prompt.strip():
            raise ValueError("prompt must not be empty")

        client = self._get_client()
        try:
            response = client.models.generate_content(model=self.model, contents=prompt)
            response_text = getattr(response, "text", None)
        except Exception as exc:  # Provider exceptions are intentionally contained here.
            raise LLMError("Gemini request failed") from exc

        if not isinstance(response_text, str) or not response_text.strip():
            raise LLMError("Gemini returned an empty or non-text response")
        return response_text.strip()

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        if not self._api_key:
            raise LLMError("GEMINI_API_KEY is not configured")
        try:
            from google import genai

            self._client = genai.Client(api_key=self._api_key)
            return self._client
        except Exception as exc:
            raise LLMError("Unable to initialize the Gemini client") from exc
