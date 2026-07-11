"""Structured models for vendor proposal analysis."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ComplianceStatus(str, Enum):
    met = "met"
    not_met = "not_met"
    unclear = "unclear"


class ComplianceRow(BaseModel):
    requirement: str
    status: ComplianceStatus
    quote: str | None = None


class ProposalAnalysis(BaseModel):
    total_cost: float = Field(description="Total proposed cost as a number.")
    currency: str = Field(default="USD")
    timeline_months: int = Field(description="Proposed delivery timeline in months.")
    team_size: int = Field(default=5)
    technical_score: float = Field(ge=0, le=10)
    commercial_score: float = Field(ge=0, le=10)
    legal_score: float = Field(ge=0, le=10)
    overall_score: float = Field(ge=0, le=10)
    compliance: list[ComplianceRow] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    summary: str = Field(description="Executive summary for procurement managers.")
