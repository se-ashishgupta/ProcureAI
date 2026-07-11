"""Graph state for per-vendor proposal chat."""

from __future__ import annotations

from typing import Annotated, Any

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class State(TypedDict, total=False):
    messages: Annotated[list[AnyMessage], add_messages]
    vendor_name: str
    file_name: str
    rfp_markdown: str
    analysis: dict[str, Any]


class ConfigSchema(TypedDict, total=False):
    model: str
    temperature: float
