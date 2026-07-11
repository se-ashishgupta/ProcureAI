r"""Procurement Intelligence RFP agent graph.

Human-in-the-loop flow:

    START -> triage -> (clear?) -> analyze -> (ready?) -> compose -> await_review
                    |                       |                          |
                    |                       \-> await_human -> triage  |
                    \-(unclear)-> advise -> await_human -> triage      |
                                                                         |
                    confirm -----------------------------------------> END
                    edit ---------------------------------> analyze (loop)
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from .nodes import (
    advise,
    analyze,
    await_human,
    await_review,
    compose,
    route_after_analyze,
    route_after_review,
    route_after_triage,
    triage,
)
from .state import ConfigSchema, State


def build_graph() -> StateGraph:
    builder = StateGraph(State, config_schema=ConfigSchema)

    builder.add_node("triage", triage)
    builder.add_node("advise", advise)
    builder.add_node("analyze", analyze)
    builder.add_node("await_human", await_human)
    builder.add_node("compose", compose)
    builder.add_node("await_review", await_review)

    builder.add_edge(START, "triage")
    builder.add_conditional_edges(
        "triage",
        route_after_triage,
        {"analyze": "analyze", "advise": "advise"},
    )
    builder.add_edge("advise", "await_human")
    builder.add_conditional_edges(
        "analyze",
        route_after_analyze,
        {"compose": "compose", "await_human": "await_human"},
    )
    builder.add_edge("await_human", "triage")
    builder.add_edge("compose", "await_review")
    builder.add_conditional_edges(
        "await_review",
        route_after_review,
        {"analyze": "analyze", "__end__": END},
    )

    return builder


graph = build_graph().compile()
graph.name = "procurement_rfp_agent"
