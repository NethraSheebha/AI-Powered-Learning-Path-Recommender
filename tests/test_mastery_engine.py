import pytest
from app.services.mastery_engine import (
    update_mastery,
    initialize_node_bkt_params,
    get_mastery_threshold,
)

class DummyNode:
    def __init__(self, p_init=0.4, p_transit=0.1, p_slip=0.1, p_guess=0.2, p_mastery=0.4, status="available"):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_slip = p_slip
        self.p_guess = p_guess
        self.p_mastery = p_mastery
        self.status = status


def test_get_mastery_threshold():
    threshold = get_mastery_threshold()
    assert threshold == 0.85


def test_bkt_correct_sequence_converges_to_one():
    """
    Verifies that a sequence of correct answers monotonically increases p_mastery,
    eventually converging close to 1.0 (crossing the 0.85 threshold).
    """
    node = DummyNode(p_init=0.4, p_transit=0.1, p_slip=0.1, p_guess=0.2, p_mastery=0.4)
    initial_mastery = node.p_mastery

    mastery_history = []
    # Submit 6 consecutive correct answers
    for _ in range(6):
        new_mastery = update_mastery(node, correct=True)
        mastery_history.append(new_mastery)

    # 1. Every step should increase mastery
    assert mastery_history[0] > initial_mastery
    for i in range(len(mastery_history) - 1):
        assert mastery_history[i + 1] >= mastery_history[i]

    # 2. Final mastery after correct sequence should cross 0.85 threshold
    assert node.p_mastery >= 0.85


def test_bkt_incorrect_sequence_keeps_mastery_low():
    """
    Verifies that a sequence of incorrect answers decreases p_mastery and keeps it low.
    """
    node = DummyNode(p_init=0.4, p_transit=0.1, p_slip=0.1, p_guess=0.2, p_mastery=0.5)

    mastery_history = []
    # Submit 4 consecutive incorrect answers
    for _ in range(4):
        new_mastery = update_mastery(node, correct=False)
        mastery_history.append(new_mastery)

    # 1. Mastery should decline or stay very low
    assert node.p_mastery < 0.4
    assert mastery_history[-1] < 0.20
