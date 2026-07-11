"""Await-review node: interrupt after RFP generation for edit or confirmation."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import HumanMessage
from langgraph.types import interrupt

from ..state import State
from ._helpers import last_ai_content, parse_review_response


def await_review(state: State) -> dict[str, Any]:
    """Pause after compose so the user can confirm or request edits on the UI.

    Resume with:
    - confirm text (e.g. \"confirm\", \"approved\") or ``{\"action\": \"confirm\"}``
    - edit feedback as plain text or ``{\"action\": \"edit\", \"content\": \"...\"}``

    Confirmed runs end; edits loop back through analyze -> compose -> await_review.
    """
    rfp_markdown = state.get("rfp_markdown") or last_ai_content(state)

    review_input = interrupt(
        {
            "type": "rfp_review",
            "stage": "review",
            "rfp_markdown": rfp_markdown,
            "assistant_message": (
                "Your RFP draft is ready. Review it above, then:\n"
                "- Reply **confirm** (or approve) to finalize\n"
                "- Or describe the changes you want and we will revise the draft"
            ),
            "actions": ["confirm", "edit"],
        }
    )

    confirmed, message = parse_review_response(review_input)
    if not message:
        raise ValueError("Review response is required to continue.")

    if confirmed:
        return {
            "messages": [HumanMessage(content=message)],
            "rfp_confirmed": True,
            "interaction_stage": "review",
        }

    return {
        "messages": [HumanMessage(content=message)],
        "rfp_confirmed": False,
        "ready_to_compose": True,
        "interaction_stage": "review_edit",
    }
