"""Analyze a vendor proposal against the RFP using structured LLM output."""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig

from agent.rfp.llm import get_model
from agent.rfp.nodes._helpers import config_values

from ..demo_content import demo_text_for_vendor
from ..prompts import ANALYZE_PROPOSAL_HUMAN, ANALYZE_PROPOSAL_SYSTEM
from ..schemas import ProposalAnalysis


def _to_client_analysis(data: ProposalAnalysis) -> dict[str, Any]:
    """Convert snake_case schema to client camelCase keys."""
    raw = data.model_dump(mode="json")
    return {
        "totalCost": raw["total_cost"],
        "currency": raw["currency"],
        "timelineMonths": raw["timeline_months"],
        "teamSize": raw["team_size"],
        "technicalScore": raw["technical_score"],
        "commercialScore": raw["commercial_score"],
        "legalScore": raw["legal_score"],
        "overallScore": raw["overall_score"],
        "compliance": [
            {
                "requirement": row["requirement"],
                "status": row["status"],
                "quote": row.get("quote"),
            }
            for row in raw["compliance"]
        ],
        "highlights": raw["highlights"],
        "risks": raw["risks"],
        "summary": raw["summary"],
    }


def analyze_proposal(state: dict[str, Any], config: RunnableConfig) -> dict[str, Any]:
    vendor_name = (state.get("vendor_name") or "Vendor").strip()
    file_name = (state.get("file_name") or "proposal.pdf").strip()
    rfp_markdown = state.get("rfp_markdown") or ""
    proposal_text = (state.get("proposal_text") or "").strip()

    if not proposal_text:
        proposal_text = demo_text_for_vendor(vendor_name)
    if not proposal_text:
        proposal_text = (
            f"Demo proposal upload for {vendor_name} ({file_name}). "
            "No extracted text — generate plausible analysis for a cloud migration RFP."
        )

    model, temperature = config_values(config)
    llm = get_model(model, temperature)
    structured = llm.with_structured_output(ProposalAnalysis).with_config(
        {"tags": ["langsmith:nostream"]}
    )

    system = ANALYZE_PROPOSAL_SYSTEM.format(
        rfp_markdown=rfp_markdown[:8000] or "No RFP context provided."
    )
    human = ANALYZE_PROPOSAL_HUMAN.format(
        vendor_name=vendor_name,
        file_name=file_name,
        proposal_text=proposal_text[:12000],
    )

    result: ProposalAnalysis = structured.invoke(
        [
            ("system", system),
            ("human", human),
        ]
    )  # type: ignore[assignment]

    analysis = _to_client_analysis(result)
    summary_msg = (
        f"Analysis complete for {vendor_name}. "
        f"Overall score: {analysis['overallScore']}/10. "
        f"{analysis['summary']}"
    )

    return {
        "analysis": analysis,
        "messages": [AIMessage(content=summary_msg)],
    }
