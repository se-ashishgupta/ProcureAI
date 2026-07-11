"""Shared helpers for RFP graph nodes."""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig

from ..schemas import RFPDraft
from ..state import State

CONFIRM_PHRASES = frozenset(
    {
        "confirm",
        "confirmed",
        "approve",
        "approved",
        "finalize",
        "finalized",
        "accept",
        "accepted",
        "yes",
        "ok",
        "okay",
        "looks good",
        "good to go",
    }
)


def config_values(config: RunnableConfig) -> tuple[str | None, float | None]:
    """Extract optional model/temperature overrides from the run config."""
    configurable = (config or {}).get("configurable", {})
    return configurable.get("model"), configurable.get("temperature")


def template_sections_block(state: State) -> str:
    """Format template section headings for compose/analyze prompts."""
    sections = state.get("template_sections") or []
    file_name = (state.get("template_file_name") or "").strip()
    if not sections:
        return (
            "Use clear section headings (##) such as: Overview / Background, "
            "Objectives, Scope of Work, Out of Scope, Deliverables, Requirements "
            "(Functional / Technical / Compliance), Line Items, Budget, Timeline, "
            "Evaluation Criteria, Submission Requirements, Terms & Conditions, "
            "and Contact. Only include sections that have content."
        )

    lines = "\n".join(f"  {index + 1}. {title}" for index, title in enumerate(sections))
    source = f" (from template: {file_name})" if file_name else ""
    return (
        f"The buyer selected an RFP template{source}. You MUST use EXACTLY these "
        f"section headings in this order as ## Markdown headings — one section per "
        f"heading, even if some sections are brief:\n{lines}\n"
        f"Do not rename, merge, skip, or reorder these sections."
    )


def draft_json(state: State) -> str:
    """Serialize the current draft (or an empty draft) for prompting."""
    draft = state.get("draft") or RFPDraft().model_dump()
    return json.dumps(draft, indent=2, default=str)


def extract_message_text(content: Any) -> str:
    """Flatten LangChain message content (plain str or content-block list) to text."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                text = block.get("text")
                if isinstance(text, str):
                    parts.append(text)
                elif text is not None:
                    parts.append(str(text))
        return "\n".join(parts)
    return str(content)


def last_ai_content(state: State) -> str:
    for message in reversed(state["messages"]):
        if isinstance(message, AIMessage):
            return extract_message_text(message.content)
    return ""


def normalize_human_input(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        for key in ("content", "message", "text", "input", "feedback"):
            if value.get(key):
                return str(value[key]).strip()
    return str(value).strip()


def parse_review_response(value: Any) -> tuple[bool, str]:
    """Return (confirmed, message_text) from an interrupt resume value."""
    if isinstance(value, dict):
        action = str(value.get("action", "")).lower().strip()
        if value.get("confirmed") is True or action in {"confirm", "approve", "accept"}:
            return True, normalize_human_input(value) or "Confirmed."
        if action in {"edit", "revise", "reject"}:
            return False, normalize_human_input(value)
        text = normalize_human_input(value)
        if text.lower() in CONFIRM_PHRASES:
            return True, text
        return False, text

    text = normalize_human_input(value)
    if text.lower() in CONFIRM_PHRASES:
        return True, text
    return False, text
