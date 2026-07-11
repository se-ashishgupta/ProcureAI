"""Await-human node: human-in-the-loop interrupt for pre-draft questions."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import HumanMessage
from langgraph.types import interrupt

from ..state import State
from ._helpers import last_ai_content, normalize_human_input


def await_human(state: State) -> dict[str, Any]:
    """Pause until the user answers roadmap or clarifying questions."""
    assistant_message = last_ai_content(state)
    stage = state.get("interaction_stage") or "gather"

    human_input = interrupt(
        {
            "type": "rfp_human_input",
            "stage": stage,
            "assistant_message": assistant_message,
            "missing_critical": state.get("missing_critical") or [],
            "need_summary": state.get("need_summary"),
            "actions": ["reply"],
        }
    )

    content = normalize_human_input(human_input)
    if not content:
        raise ValueError("Human input is required to continue the RFP workflow.")

    return {"messages": [HumanMessage(content=content)]}
