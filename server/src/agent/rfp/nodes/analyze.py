"""Analyze node: extract and merge requirements into a structured RFP draft."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from ..llm import get_model
from ..prompts import ANALYZE_SYSTEM_PROMPT, CRITICAL_FIELDS
from ..schemas import Analysis
from ..state import State
from ._helpers import config_values, draft_json, template_sections_block


def analyze(state: State, config: RunnableConfig) -> dict[str, Any]:
    """Extract/merge requirements and decide if ready to compose."""
    model, temperature = config_values(config)
    llm = get_model(model, temperature)
    structured = llm.with_structured_output(Analysis).with_config(
        {"tags": ["langsmith:nostream"]}
    )

    system = SystemMessage(
        content=ANALYZE_SYSTEM_PROMPT.format(
            critical_fields="\n".join(f"- {f}" for f in CRITICAL_FIELDS),
            template_sections_block=template_sections_block(state),
            draft_json=draft_json(state),
        )
    )

    analysis: Analysis = structured.invoke([system, *state["messages"]])  # type: ignore[assignment]

    return {
        "messages": [AIMessage(content=analysis.reply_to_user)],
        "draft": analysis.draft.model_dump(),
        "missing_critical": analysis.missing_critical,
        "ready_to_compose": analysis.ready_to_compose,
        "interaction_stage": "gather",
    }
