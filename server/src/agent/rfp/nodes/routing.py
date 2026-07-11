"""Routing functions for conditional edges in the RFP graph."""

from __future__ import annotations

from ..state import State


def route_after_triage(state: State) -> str:
    """Send clear requests to gathering, unclear ones to advisory guidance."""
    return "analyze" if state.get("has_clear_requirements") else "advise"


def route_after_analyze(state: State) -> str:
    """Compose when ready; otherwise pause for human input via interrupt."""
    return "compose" if state.get("ready_to_compose") else "await_human"


def route_after_review(state: State) -> str:
    """Finalize on confirm; otherwise revise via analyze."""
    return "__end__" if state.get("rfp_confirmed") else "analyze"
