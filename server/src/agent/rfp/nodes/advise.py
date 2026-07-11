"""Advise node: roadmap and guiding questions for unclear requests."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from ..llm import get_model
from ..prompts import ADVISE_SYSTEM_PROMPT
from ..state import State
from ._helpers import config_values, draft_json, extract_message_text


def advise(state: State, config: RunnableConfig) -> dict[str, Any]:
    """Give a roadmap, suggestions, and guiding questions."""
    model, temperature = config_values(config)
    llm = get_model(model, temperature)

    system = SystemMessage(
        content=ADVISE_SYSTEM_PROMPT.format(
            need_summary=state.get("need_summary") or "unclear",
            draft_json=draft_json(state),
        )
    )
    result = llm.invoke([system, *state["messages"]])
    content = extract_message_text(result.content)

    return {"messages": [AIMessage(content=content)], "interaction_stage": "advise"}
