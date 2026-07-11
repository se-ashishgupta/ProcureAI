"""Vendor proposal analysis LangGraph."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from .nodes.analyze import analyze_proposal
from .state import ConfigSchema, State


def build_graph() -> StateGraph:
    builder = StateGraph(State, config_schema=ConfigSchema)
    builder.add_node("analyze_proposal", analyze_proposal)
    builder.add_edge(START, "analyze_proposal")
    builder.add_edge("analyze_proposal", END)
    return builder


graph = build_graph().compile()
graph.name = "proposal_analysis_agent"
