"""Triage node: classify whether the user has clear procurement requirements."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig

from ..llm import get_model
from ..prompts import TRIAGE_SYSTEM_PROMPT
from ..schemas import Triage
from ..state import State
from ._helpers import config_values, draft_json


def triage(state: State, config: RunnableConfig) -> dict[str, Any]:
    """Classify intent: clear requirements vs need for guidance."""
    model, temperature = config_values(config)
    llm = get_model(model, temperature)
    structured = llm.with_structured_output(Triage).with_config(
        {"tags": ["langsmith:nostream"]}
    )

    system = SystemMessage(
        content=TRIAGE_SYSTEM_PROMPT.format(draft_json=draft_json(state))
    )
    result: Triage = structured.invoke([system, *state["messages"]])  # type: ignore[assignment]

    return {
        "has_clear_requirements": result.has_clear_requirements,
        "need_summary": result.need_summary,
    }
