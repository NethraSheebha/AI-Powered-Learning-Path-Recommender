# AI/LLM Engine

Member 3's independent AI/LLM layer for the AI-Powered Learning Path Recommender. It provides provider-isolated Gemini access, validated learning-graph generation, rubric evaluation, student-friendly explanations, and local semantic retrieval. Application integration is owned by another team member.

## Modules

- `llm_service.py` — `LLMClient` protocol and Gemini implementation.
- `goal_graph_engine.py` — generates and validates prerequisite learning graphs.
- `rubric_engine.py` — evaluates submissions against rubrics with structured output.
- `explanation_engine.py` — generates learner-friendly explanations.
- `chroma_service.py` — local persistent ChromaDB collection access.
- `prompts/` — external prompt templates for the three LLM engines.
- `tests/` — offline unit tests using `FakeLLM`.

## Installation and Gemini setup

```powershell
python -m pip install -r requirements.txt
```

Gemini support uses `google-genai`. Set `GEMINI_API_KEY` through the deployment environment; never hardcode an API key. `.env.example` contains only a placeholder. `GeminiLLMService` defaults to `gemini-3.6-flash`.

Domain engines accept an `LLMClient` and must not use `google-genai` directly. Create one `GeminiLLMService` at the integration boundary and pass it to the engine contracts.

## Public integration contracts

```python
from llm_service import GeminiLLMService
from goal_graph_engine import generate_learning_graph
from rubric_engine import evaluate_submission
from explanation_engine import generate_explanation
from chroma_service import ChromaService

llm = GeminiLLMService()

# Validated dict with a non-empty `nodes` list. Each node includes id, title,
# description, prerequisites, difficulty, estimated_hours, and resources.
learning_graph = generate_learning_graph("Become a Python developer", llm)

# Validated dict: score, strengths, weaknesses, missing_concepts, and feedback.
evaluation = evaluate_submission(
    "My submitted answer...",
    "Assess clarity, correctness, and supporting evidence.",
    llm,
)

explanation = generate_explanation(
    "recursion",
    "The learner is familiar with Python functions.",
    llm,
)
```

## ChromaDB retrieval

`chroma_service.py` uses `chromadb` for persistent local semantic retrieval; no external database server is required. The default persistence path is `data/chroma/`.

```python
from chroma_service import ChromaService

resources = ChromaService("learning_resources")
resources.add_documents(
    documents=["Python's official tutorial covers language fundamentals."],
    ids=["python-tutorial"],
    metadatas=[{"topic": "python"}],
)
matches = resources.query("Where can I learn Python basics?", n_results=3)
```

`add_documents()` upserts documents with stable IDs and optional metadata. `query()` returns Chroma's relevant-document result for the supplied text.

## Testing

```powershell
python -m pytest -q
```

Current result: **19 passed**. Tests use `FakeLLM`; they do not call Gemini or require an API key.

## Integration notes

Consume this module through the public engine contracts above. Keep Gemini creation centralized rather than instantiating it throughout the application, and supply credentials only through environment-based deployment configuration.
