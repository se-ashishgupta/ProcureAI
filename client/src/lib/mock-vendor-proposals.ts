import type { VendorProposalAnalysis } from "@/types";

export interface DemoVendorTemplate {
  vendorName: string;
  fileName: string;
  proposalText: string;
  analysis: VendorProposalAnalysis;
}

const AWS_COMPLIANCE: VendorProposalAnalysis["compliance"] = [
  {
    requirement: "AWS-certified migration team",
    status: "met",
    quote: "Our team includes 4 AWS Professional Architects with 50+ migrations delivered.",
  },
  {
    requirement: "Timeline within 6 months",
    status: "met",
    quote: "We propose a 5-month phased migration with go-live by November 2026.",
  },
  {
    requirement: "Budget cap $150,000 USD",
    status: "met",
    quote: "Total fixed price: $142,500 USD including 12 months hypercare support.",
  },
  {
    requirement: "Minimal downtime (< 4 hours per app)",
    status: "unclear",
    quote: "Downtime windows will be agreed per application during discovery.",
  },
  {
    requirement: "Data residency in US regions",
    status: "met",
    quote: "All workloads will run in us-east-1 with cross-region backup in us-west-2.",
  },
];

export const DEMO_VENDOR_TEMPLATES: DemoVendorTemplate[] = [
  {
    vendorName: "CloudTech Solutions",
    fileName: "cloudtech-aws-proposal.pdf",
    proposalText:
      "CloudTech Solutions proposes a fixed-price AWS migration at $142,500 USD over 5 months with 8 engineers including 4 AWS Professional Architects. Includes 12 months hypercare.",
    analysis: {
      totalCost: 142500,
      currency: "USD",
      timelineMonths: 5,
      teamSize: 8,
      technicalScore: 8.5,
      commercialScore: 8.8,
      legalScore: 9.0,
      overallScore: 8.7,
      compliance: AWS_COMPLIANCE,
      highlights: [
        "Strong AWS partnership tier",
        "Fixed-price model with clear milestone billing",
        "Includes 12 months post-migration support",
      ],
      risks: ["Downtime SLA needs clarification per app"],
      summary:
        "CloudTech offers a competitive fixed price under budget with a certified team and solid compliance coverage.",
    },
  },
  {
    vendorName: "Nimbus Cloud Partners",
    fileName: "nimbus-migration-bid.pdf",
    proposalText:
      "Nimbus Cloud Partners bids $138,000 USD for a 6-month migration. Legacy ERP may need an 8-hour maintenance window.",
    analysis: {
      totalCost: 138000,
      currency: "USD",
      timelineMonths: 6,
      teamSize: 6,
      technicalScore: 7.8,
      commercialScore: 9.2,
      legalScore: 8.0,
      overallScore: 8.3,
      compliance: [
        {
          requirement: "AWS-certified migration team",
          status: "met",
          quote: "3 Solutions Architects and 2 DevOps engineers hold AWS certifications.",
        },
        {
          requirement: "Timeline within 6 months",
          status: "met",
          quote: "Delivery in 6 months with parallel wave migrations.",
        },
        {
          requirement: "Budget cap $150,000 USD",
          status: "met",
          quote: "All-in price $138,000 USD.",
        },
        {
          requirement: "Minimal downtime (< 4 hours per app)",
          status: "not_met",
          quote: "Legacy ERP may require an 8-hour maintenance window.",
        },
        {
          requirement: "Data residency in US regions",
          status: "met",
          quote: "Primary region us-east-1; no data stored outside US.",
        },
      ],
      highlights: ["Lowest total cost", "Transparent cost breakdown by wave"],
      risks: ["ERP downtime exceeds RFP target", "Smaller team than peers"],
      summary:
        "Nimbus is the most cost-effective option but carries downtime risk on the ERP cutover.",
    },
  },
  {
    vendorName: "Apex Systems Integrators",
    fileName: "apex-cloud-proposal.docx",
    proposalText:
      "Apex Systems Integrators offers 4-month accelerated delivery for $155,000 USD with blue/green deployments under 2 hours downtime.",
    analysis: {
      totalCost: 155000,
      currency: "USD",
      timelineMonths: 4,
      teamSize: 10,
      technicalScore: 9.2,
      commercialScore: 7.0,
      legalScore: 8.5,
      overallScore: 8.1,
      compliance: [
        {
          requirement: "AWS-certified migration team",
          status: "met",
          quote: "Dedicated pod of 10 engineers including 5 AWS-certified specialists.",
        },
        {
          requirement: "Timeline within 6 months",
          status: "met",
          quote: "Accelerated 4-month plan using automated refactoring tooling.",
        },
        {
          requirement: "Budget cap $150,000 USD",
          status: "not_met",
          quote: "Total proposal $155,000 USD — premium for accelerated delivery.",
        },
        {
          requirement: "Minimal downtime (< 4 hours per app)",
          status: "met",
          quote: "Blue/green deployments target < 2 hours downtime per application.",
        },
        {
          requirement: "Data residency in US regions",
          status: "met",
          quote: "US-only deployment with encryption at rest (KMS).",
        },
      ],
      highlights: ["Fastest timeline", "Best technical depth and automation"],
      risks: ["5% over stated budget cap", "Higher Year 2 support costs quoted"],
      summary:
        "Apex leads on technical capability and speed but exceeds the budget ceiling.",
    },
  },
  {
    vendorName: "PrimeVendor Global",
    fileName: "primevendor-rfp-response.pdf",
    proposalText:
      "PrimeVendor Global fixed fee $149,000 USD over 5 months with flexible payment terms and medium liability deviation.",
    analysis: {
      totalCost: 149000,
      currency: "USD",
      timelineMonths: 5,
      teamSize: 7,
      technicalScore: 7.5,
      commercialScore: 8.0,
      legalScore: 7.2,
      overallScore: 7.6,
      compliance: [
        {
          requirement: "AWS-certified migration team",
          status: "unclear",
          quote: "Partnership with regional AWS MSP; certifications listed in appendix.",
        },
        {
          requirement: "Timeline within 6 months",
          status: "met",
          quote: "5-month delivery aligned to RFP milestones.",
        },
        {
          requirement: "Budget cap $150,000 USD",
          status: "met",
          quote: "Fixed fee $149,000 USD.",
        },
        {
          requirement: "Minimal downtime (< 4 hours per app)",
          status: "unclear",
          quote: "Downtime plan to be finalized in discovery phase.",
        },
        {
          requirement: "Data residency in US regions",
          status: "met",
          quote: "All production workloads in US AWS regions.",
        },
      ],
      highlights: ["Balanced commercial offer", "Flexible payment terms"],
      risks: [
        "Several compliance items marked unclear",
        "Legal deviations on liability cap (Medium severity)",
      ],
      summary:
        "PrimeVendor is mid-pack overall with documentation gaps that need clarification.",
    },
  },
];
