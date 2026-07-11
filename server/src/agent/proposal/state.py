"""Graph state for proposal analysis."""

from __future__ import annotations

from typing import Any

from typing_extensions import TypedDict


class State(TypedDict, total=False):
    vendor_name: str
    file_name: str
    rfp_markdown: str
    proposal_text: str
    analysis: dict[str, Any]


class ConfigSchema(TypedDict, total=False):
    model: str
    temperature: float
