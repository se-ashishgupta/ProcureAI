"""Structured data models for the procurement RFP agent."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ProcurementCategory(str, Enum):
    """High-level type of procurement."""

    goods = "goods"
    services = "services"
    software = "software"
    hardware = "hardware"
    construction = "construction"
    consulting = "consulting"
    other = "other"


class LineItem(BaseModel):
    """A single good or service being requested."""

    name: str = Field(description="Short name of the item or service.")
    quantity: int | None = Field(
        default=None, description="How many units are required, if applicable."
    )
    unit: str | None = Field(
        default=None, description="Unit of measure, e.g. 'licenses', 'hours', 'units'."
    )
    specifications: str | None = Field(
        default=None, description="Key specs, standards, or constraints for this item."
    )


class EvaluationCriterion(BaseModel):
    """A criterion vendors will be scored against."""

    criterion: str = Field(description="Name of the criterion, e.g. 'Technical fit'.")
    weight_percent: float | None = Field(
        default=None, description="Relative weight as a percentage (0-100)."
    )
    description: str | None = Field(
        default=None, description="What 'good' looks like for this criterion."
    )


class Timeline(BaseModel):
    """Key procurement dates."""

    rfp_issue_date: str | None = None
    questions_due: str | None = None
    proposal_due: str | None = None
    award_date: str | None = None
    project_start: str | None = None
    project_end: str | None = None


class Budget(BaseModel):
    """Budget envelope for the procurement."""

    minimum: float | None = None
    maximum: float | None = None
    currency: str | None = Field(
        default=None, description="ISO currency code, e.g. 'USD', 'INR', 'EUR'."
    )
    notes: str | None = Field(
        default=None, description="Any budget caveats, e.g. 'excludes taxes'."
    )


class RFPDraft(BaseModel):
    """The full structured RFP."""

    title: str | None = Field(default=None, description="Concise RFP title.")
    organization: str | None = Field(
        default=None, description="Name of the buying organization."
    )
    category: ProcurementCategory | None = Field(
        default=None, description="Type of procurement."
    )
    background: str | None = Field(
        default=None, description="Context / business need driving this RFP."
    )
    objectives: list[str] = Field(
        default_factory=list, description="What success looks like for the buyer."
    )
    scope_of_work: list[str] = Field(
        default_factory=list, description="Concrete activities or supply in scope."
    )
    out_of_scope: list[str] = Field(
        default_factory=list, description="Explicitly excluded items."
    )
    deliverables: list[str] = Field(
        default_factory=list, description="Tangible outputs the vendor must provide."
    )
    line_items: list[LineItem] = Field(default_factory=list)
    functional_requirements: list[str] = Field(default_factory=list)
    technical_requirements: list[str] = Field(default_factory=list)
    compliance_requirements: list[str] = Field(
        default_factory=list,
        description="Regulatory, security, or certification requirements.",
    )
    budget: Budget | None = None
    timeline: Timeline | None = None
    evaluation_criteria: list[EvaluationCriterion] = Field(default_factory=list)
    submission_requirements: list[str] = Field(
        default_factory=list,
        description="What vendors must include in their proposal.",
    )
    terms_and_conditions: list[str] = Field(default_factory=list)
    contact_name: str | None = None
    contact_email: str | None = None


class Triage(BaseModel):
    """Intent classification at the start of every turn."""

    has_clear_requirements: bool = Field(
        description="True if the user has a reasonably specific procurement need "
        "(they know roughly WHAT they want to buy and WHY). False if the request "
        "is vague, exploratory, or they are asking for help/ideas on how to "
        "approach the procurement."
    )
    need_summary: str = Field(
        description="One short sentence summarizing what the user wants to "
        "procure, or 'unclear' if it cannot be determined yet."
    )
    reasoning: str = Field(
        description="Brief justification for the classification (one sentence)."
    )


class Analysis(BaseModel):
    """Structured output from the analyze node."""

    draft: RFPDraft = Field(
        description="The complete RFP draft, merging prior known fields with any "
        "new information from the latest user message. Never drop previously "
        "known values."
    )
    missing_critical: list[str] = Field(
        default_factory=list,
        description="Human-readable names of critical fields still missing or unclear.",
    )
    ready_to_compose: bool = Field(
        description="True only when enough critical information exists to draft a "
        "useful RFP, or the user has explicitly asked to generate it now."
    )
    reply_to_user: str = Field(
        description="The assistant's next message: either a short, friendly batch of "
        "clarifying questions, or a confirmation that the RFP is being generated."
    )
