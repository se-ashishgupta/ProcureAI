"""Compose node: render the structured draft into a Markdown RFP."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from ..llm import get_model
from ..prompts import COMPOSE_SYSTEM_PROMPT
from ..state import State
from ._helpers import config_values, draft_json, extract_message_text, template_sections_block


def compose(state: State, config: RunnableConfig) -> dict[str, Any]:
    """Render the finalized structured draft into a polished Markdown RFP."""
    model, temperature = config_values(config)
    llm = get_model(model, temperature)

    system = SystemMessage(
        content=COMPOSE_SYSTEM_PROMPT.format(
            draft_json=draft_json(state),
            template_sections_block=template_sections_block(state),
        )
    )
    instruction = (
        "Generate the complete RFP document now using the structured data above."
    )

    result = llm.invoke([system, ("human", instruction)])
    rfp_markdown = extract_message_text(result.content)
    # Some models return escaped newlines in a single-line string.
    if "\\n" in rfp_markdown and rfp_markdown.count("\n") < 3:
        rfp_markdown = (
            rfp_markdown.replace("\\n", "\n").replace("\\t", "\t").replace("\\r", "")
        )

    return {
        "messages": [AIMessage(content=rfp_markdown)],
        "rfp_markdown": rfp_markdown,
    }
