"""Demo vendor proposal text for analysis when files are not parsed server-side."""

from __future__ import annotations

DEMO_PROPOSAL_TEXT: dict[str, str] = {
    "cloudtech solutions": (
        "CloudTech Solutions proposes a fixed-price AWS migration at $142,500 USD "
        "over 5 months with 8 engineers including 4 AWS Professional Architects. "
        "Includes 12 months hypercare. All workloads in us-east-1 with us-west-2 backup. "
        "Downtime windows agreed per application during discovery."
    ),
    "nimbus cloud partners": (
        "Nimbus Cloud Partners bids $138,000 USD for a 6-month migration with 6 engineers. "
        "Three Solutions Architects hold AWS certs. Legacy ERP may need an 8-hour window. "
        "US-only data residency in us-east-1."
    ),
    "apex systems integrators": (
        "Apex Systems Integrators offers accelerated 4-month delivery for $155,000 USD "
        "with 10 engineers and blue/green deployments under 2 hours downtime per app. "
        "Exceeds budget cap slightly. Year 2 support priced higher than peers."
    ),
    "primevendor global": (
        "PrimeVendor Global fixed fee $149,000 USD over 5 months. Flexible payment terms. "
        "Partnership with regional AWS MSP. Several compliance items deferred to discovery. "
        "Liability cap deviation noted as medium legal risk."
    ),
}


def demo_text_for_vendor(vendor_name: str) -> str:
    key = vendor_name.strip().lower()
    return DEMO_PROPOSAL_TEXT.get(key, "")
