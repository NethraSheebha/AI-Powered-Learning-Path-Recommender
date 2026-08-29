"""
================================================================================
AI-Powered-Learning-Path-Recommender Mastery Engine - Bayesian Knowledge Tracing (BKT)
================================================================================

Approach Choice & Rationale:
----------------------------
We implemented the standard 2-state Hidden Markov Model (HMM) Bayesian Knowledge
Tracing update equations directly in Python rather than wrapping the `pyBKT` library.

Why Direct HMM Equations over pyBKT?
1. **API Fit**: `pyBKT` is structured for offline batch fitting (`fit()`) and batch
   predictions (`predict()`) over pandas DataFrames containing tabular student response
   logs across multiple concepts.
2. **Performance & Overhead**: Calling `pyBKT` for a single real-time observation update
   in a web request handler requires building dynamic DataFrames, instantiating model
   wrappers, and running matrix operations, adding unnecessary latency.
3. **Exact Equivalence**: The closed-form 2-state HMM equations below are mathematically
   identical to the core BKT update algorithm used by pyBKT, providing exact, instant,
   $O(1)$ computation in pure Python without extra dependencies.

================================================================================
BKT Mathematical Equations:
================================================================================

Parameters for a Concept Node:
  - P(L_{t-1}) : Prior mastery probability (node.p_mastery or p_init if initial)
  - P(T)       : Transition probability of learning (node.p_transit, default 0.1)
  - P(S)       : Slip probability (node.p_slip, default 0.1)
  - P(G)       : Guess probability (node.p_guess, default 0.2)

1. Posterior Update Step (Bayes' Rule given observation):

   If observation is CORRECT:
     P(L_t | correct) = [ P(L_{t-1}) * (1 - P(S)) ] / P(Correct)
     where P(Correct)  = P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)

   If observation is INCORRECT:
     P(L_t | incorrect) = [ P(L_{t-1}) * P(S) ] / P(Incorrect)
     where P(Incorrect)  = P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G))

2. Learning Transition Step:
     P(L_t)_new = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)

================================================================================
"""

import os
from typing import Any

# Default literature BKT parameter values
DEFAULT_P_INIT = 0.4
DEFAULT_P_TRANSIT = 0.1
DEFAULT_P_SLIP = 0.1
DEFAULT_P_GUESS = 0.2
DEFAULT_MASTERY_THRESHOLD = 0.85


def get_mastery_threshold() -> float:
    """
    Returns the mastery threshold above which a node is considered 'mastered'.
    Can be overridden via the MASTERY_THRESHOLD environment variable.
    """
    env_val = os.getenv("MASTERY_THRESHOLD")
    if env_val:
        try:
            return float(env_val)
        except ValueError:
            pass
    return DEFAULT_MASTERY_THRESHOLD


def initialize_node_bkt_params(node: Any) -> None:
    """
    Ensures sensible literature defaults for BKT parameters (p_init, p_transit, p_slip, p_guess)
    if they are not already initialized on the node object or dictionary.
    """
    if getattr(node, "p_init", None) is None or getattr(node, "p_init", 0.0) == 0.0:
        setattr(node, "p_init", DEFAULT_P_INIT)
    if getattr(node, "p_transit", None) is None or getattr(node, "p_transit", 0.0) == 0.0:
        setattr(node, "p_transit", DEFAULT_P_TRANSIT)
    if getattr(node, "p_slip", None) is None or getattr(node, "p_slip", 0.0) == 0.0:
        setattr(node, "p_slip", DEFAULT_P_SLIP)
    if getattr(node, "p_guess", None) is None or getattr(node, "p_guess", 0.0) == 0.0:
        setattr(node, "p_guess", DEFAULT_P_GUESS)


def update_mastery(node: Any, correct: bool) -> float:
    """
    Applies one BKT observation update to the given node based on the observation result (correct/incorrect).
    Returns the updated p_mastery float value.
    """
    # 1. Ensure BKT parameters exist
    initialize_node_bkt_params(node)

    # 2. Extract current state and parameters
    prior_mastery = float(getattr(node, "p_mastery", getattr(node, "p_init", DEFAULT_P_INIT)))
    if prior_mastery == 0.0 and getattr(node, "p_init", DEFAULT_P_INIT) > 0.0:
        prior_mastery = float(getattr(node, "p_init", DEFAULT_P_INIT))

    p_transit = float(getattr(node, "p_transit", DEFAULT_P_TRANSIT))
    p_slip = float(getattr(node, "p_slip", DEFAULT_P_SLIP))
    p_guess = float(getattr(node, "p_guess", DEFAULT_P_GUESS))

    # 3. Compute Posterior Probability P(L_t | obs)
    if correct:
        p_correct = (prior_mastery * (1.0 - p_slip)) + ((1.0 - prior_mastery) * p_guess)
        if p_correct > 0:
            p_posterior = (prior_mastery * (1.0 - p_slip)) / p_correct
        else:
            p_posterior = prior_mastery
    else:
        p_incorrect = (prior_mastery * p_slip) + ((1.0 - prior_mastery) * (1.0 - p_guess))
        if p_incorrect > 0:
            p_posterior = (prior_mastery * p_slip) / p_incorrect
        else:
            p_posterior = prior_mastery

    # 4. Apply Learning Transition Step
    p_mastery_new = p_posterior + ((1.0 - p_posterior) * p_transit)

    # 5. Clamp to valid probability range [0.0, 1.0]
    p_mastery_new = max(0.0, min(1.0, round(p_mastery_new, 4)))

    # Update node attribute if mutable
    if hasattr(node, "p_mastery"):
        setattr(node, "p_mastery", p_mastery_new)

    return p_mastery_new
