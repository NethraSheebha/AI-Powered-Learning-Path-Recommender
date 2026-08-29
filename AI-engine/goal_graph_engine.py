"""Generation and validation of learning prerequisite graphs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from llm_service import LLMClient


class GoalGraphValidationError(ValueError):
    """Raised when a proposed learning graph does not meet the module contract."""


_REQUIRED_NODE_FIELDS = {
    "id": str,
    "title": str,
    "description": str,
    "prerequisites": list,
    "difficulty": str,
    "estimated_hours": (int, float),
    "resources": list,
}


def generate_learning_graph(goal: str, llm: LLMClient) -> dict[str, Any]:
    """Create and validate a structured learning graph for a learner's goal."""
    if not goal.strip():
        raise ValueError("goal must not be empty")
    prompt = _load_prompt("goal_graph_prompt.txt").replace("{{goal}}", goal.strip())
    return validate_learning_graph(_parse_json(llm.generate(prompt)))


def validate_learning_graph(graph: Any) -> dict[str, Any]:
    """Validate and return a learning graph with a ``nodes`` list."""
    if not isinstance(graph, dict) or not isinstance(graph.get("nodes"), list):
        raise GoalGraphValidationError("graph must be an object containing a nodes list")
    if not graph["nodes"]:
        raise GoalGraphValidationError("graph must contain at least one learning node")

    node_ids: set[str] = set()
    for index, node in enumerate(graph["nodes"]):
        if not isinstance(node, dict):
            raise GoalGraphValidationError(f"node {index} must be an object")
        for field, expected_type in _REQUIRED_NODE_FIELDS.items():
            value = node.get(field)
            if not isinstance(value, expected_type) or (expected_type is str and not value.strip()):
                raise GoalGraphValidationError(f"node {index} has invalid {field}")
        if node["estimated_hours"] < 0:
            raise GoalGraphValidationError(f"node {index} has negative estimated_hours")
        if node["id"] in node_ids:
            raise GoalGraphValidationError(f"duplicate node id: {node['id']}")
        if not all(isinstance(item, str) and item.strip() for item in node["prerequisites"]):
            raise GoalGraphValidationError(f"node {index} has invalid prerequisites")
        node_ids.add(node["id"])

    for node in graph["nodes"]:
        unknown = set(node["prerequisites"]) - node_ids
        if unknown:
            raise GoalGraphValidationError(f"node {node['id']} references unknown prerequisites: {sorted(unknown)}")
        if node["id"] in node["prerequisites"]:
            raise GoalGraphValidationError(f"node {node['id']} cannot require itself")
    _validate_no_circular_dependencies(graph["nodes"])
    return graph


def _validate_no_circular_dependencies(nodes: list[dict[str, Any]]) -> None:
    """Raise when prerequisite edges form a dependency cycle."""
    prerequisites_by_id = {node["id"]: node["prerequisites"] for node in nodes}
    visited: set[str] = set()
    active: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in active:
            raise GoalGraphValidationError("circular prerequisite dependency")
        if node_id in visited:
            return
        active.add(node_id)
        for prerequisite_id in prerequisites_by_id[node_id]:
            visit(prerequisite_id)
        active.remove(node_id)
        visited.add(node_id)

    for node_id in prerequisites_by_id:
        visit(node_id)


def _parse_json(response: str) -> Any:
    cleaned = response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else ""
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[:-3]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GoalGraphValidationError("LLM response was not valid JSON") from exc


def _load_prompt(filename: str) -> str:
    return (Path(__file__).parent / "prompts" / filename).read_text(encoding="utf-8")
