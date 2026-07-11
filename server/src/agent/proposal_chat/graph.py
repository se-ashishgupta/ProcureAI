"""Per-vendor proposal Q&A LangGraph."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from .nodes.chat import proposal_chat
from .state import ConfigSchema, State


def build_graph() -> StateGraph:
    builder = StateGraph(State, config_schema=ConfigSchema)
    builder.add_node("proposal_chat", proposal_chat)
    builder.add_edge(START, "proposal_chat")
    builder.add_edge("proposal_chat", END)
    return builder


graph = build_graph().compile()
graph.name = "proposal_chat_agent"
