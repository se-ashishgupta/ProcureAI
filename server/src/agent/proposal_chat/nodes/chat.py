"""Chat node — answer manager questions about a single vendor proposal."""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig

from agent.rfp.llm import get_model
from agent.rfp.nodes._helpers import config_values

from ..prompts import PROPOSAL_CHAT_SYSTEM
from ..state import State


def proposal_chat(state: State, config: RunnableConfig) -> dict[str, Any]:
    model, temperature = config_values(config)
    llm = get_model(model, temperature)

    vendor_name = state.get("vendor_name") or "Vendor"
    file_name = state.get("file_name") or "proposal.pdf"
    rfp_markdown = state.get("rfp_markdown") or "No RFP on file."
    analysis = state.get("analysis") or {}

    system = SystemMessage(
        content=PROPOSAL_CHAT_SYSTEM.format(
            vendor_name=vendor_name,
            file_name=file_name,
            rfp_markdown=rfp_markdown[:6000],
            analysis_json=json.dumps(analysis, indent=2)[:8000],
        )
    )

    result = llm.invoke([system, *state.get("messages", [])])

    return {"messages": [result]}
