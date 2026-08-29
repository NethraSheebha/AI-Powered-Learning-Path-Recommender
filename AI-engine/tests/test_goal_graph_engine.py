import pytest

from goal_graph_engine import GoalGraphValidationError, generate_learning_graph, validate_learning_graph


class FakeLLM:
    def __init__(self, response: str):
        self.response = response

    def generate(self, prompt: str) -> str:
        self.prompt = prompt
        return self.response


VALID_GRAPH = '{"goal":"Learn Python","nodes":[{"id":"basics","title":"Python basics","description":"Syntax and values","prerequisites":[],"difficulty":"beginner","estimated_hours":8,"resources":["official tutorial"]},{"id":"functions","title":"Functions","description":"Reusable logic","prerequisites":["basics"],"difficulty":"beginner","estimated_hours":4,"resources":["practice exercises"]}]}'


def test_generates_valid_learning_graph() -> None:
    llm = FakeLLM(VALID_GRAPH)
    graph = generate_learning_graph("Learn Python", llm)
    assert graph["nodes"][1]["prerequisites"] == ["basics"]
    assert "Learn Python" in llm.prompt


def test_rejects_unknown_prerequisite() -> None:
    graph = {"nodes": [{"id": "a", "title": "A", "description": "D", "prerequisites": ["missing"], "difficulty": "beginner", "estimated_hours": 1, "resources": []}]}
    with pytest.raises(GoalGraphValidationError, match="unknown prerequisites"):
        validate_learning_graph(graph)


def test_rejects_malformed_llm_json() -> None:
    with pytest.raises(GoalGraphValidationError, match="valid JSON"):
        generate_learning_graph("Learn Python", FakeLLM("not json"))


def test_rejects_duplicate_node_ids() -> None:
    graph = {"nodes": [
        {"id": "same", "title": "A", "description": "D", "prerequisites": [], "difficulty": "beginner", "estimated_hours": 1, "resources": []},
        {"id": "same", "title": "B", "description": "D", "prerequisites": [], "difficulty": "beginner", "estimated_hours": 1, "resources": []},
    ]}
    with pytest.raises(GoalGraphValidationError, match="duplicate node id"):
        validate_learning_graph(graph)


def test_rejects_self_prerequisite() -> None:
    graph = {"nodes": [{"id": "a", "title": "A", "description": "D", "prerequisites": ["a"], "difficulty": "beginner", "estimated_hours": 1, "resources": []}]}
    with pytest.raises(GoalGraphValidationError, match="cannot require itself"):
        validate_learning_graph(graph)


def test_rejects_negative_estimated_hours() -> None:
    graph = {"nodes": [{"id": "a", "title": "A", "description": "D", "prerequisites": [], "difficulty": "beginner", "estimated_hours": -1, "resources": []}]}
    with pytest.raises(GoalGraphValidationError, match="negative estimated_hours"):
        validate_learning_graph(graph)


def test_rejects_missing_required_node_field() -> None:
    graph = {"nodes": [{"id": "a", "title": "A", "description": "D", "prerequisites": [], "difficulty": "beginner", "estimated_hours": 1}]}
    with pytest.raises(GoalGraphValidationError, match="invalid resources"):
        validate_learning_graph(graph)


def test_rejects_circular_prerequisite_dependency() -> None:
    graph = {"nodes": [
        {"id": "a", "title": "A", "description": "D", "prerequisites": ["b"], "difficulty": "beginner", "estimated_hours": 1, "resources": []},
        {"id": "b", "title": "B", "description": "D", "prerequisites": ["c"], "difficulty": "beginner", "estimated_hours": 1, "resources": []},
        {"id": "c", "title": "C", "description": "D", "prerequisites": ["a"], "difficulty": "beginner", "estimated_hours": 1, "resources": []},
    ]}
    with pytest.raises(GoalGraphValidationError, match="circular prerequisite dependency"):
        validate_learning_graph(graph)
