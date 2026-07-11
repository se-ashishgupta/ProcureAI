"""Graph state and runtime configuration for the procurement RFP agent."""

from __future__ import annotations

from typing import Annotated, Any

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class State(TypedDict, total=False):
    """Shared state passed between graph nodes."""

    messages: Annotated[list[AnyMessage], add_messages]
    has_clear_requirements: bool
    need_summary: str
    draft: dict[str, Any]
    missing_critical: list[str]
    ready_to_compose: bool
    rfp_markdown: str
    rfp_confirmed: bool
    template_sections: list[str]
    template_file_name: str
    # Last interaction stage: "advise", "gather", "review", or "review_edit".
    interaction_stage: str


class ConfigSchema(TypedDict, total=False):
    """Per-run configuration, overridable via the `configurable` key."""

    model: str
    temperature: float
