/**
 * Generates vendor proposal DOCX files for upload testing.
 * Run: node scripts/generate-vendor-docs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/assets/vendor-proposals");

const proposals = [
  {
    fileName: "cloudtech-aws-proposal.docx",
    vendorName: "CloudTech Solutions",
    sections: [
      {
        title: "Executive Summary",
        body: `CloudTech Solutions proposes a fixed-price AWS migration program at $142,500 USD over 5 months. Our team includes 8 engineers with 4 AWS Professional Architects who have delivered 50+ enterprise migrations. The offer includes 12 months of hypercare support post go-live.`,
      },
      {
        title: "Commercial Offer",
        bullets: [
          "Total fixed price: $142,500 USD (under $150,000 budget cap)",
          "Payment: 30% on contract, 40% at wave 2 go-live, 30% at final acceptance",
          "Timeline: 5 months with go-live targeted by November 2026",
          "Team size: 8 dedicated engineers",
        ],
      },
      {
        title: "Technical Approach",
        body: `We will execute a phased wave migration across us-east-1 with cross-region backup in us-west-2. All workloads remain in US regions. Discovery will define per-application downtime windows; we target minimal disruption and will agree cutover plans with your application owners.`,
      },
      {
        title: "Compliance Statement",
        bullets: [
          "AWS-certified migration team: MET — 4 AWS Professional Architects",
          "Timeline within 6 months: MET — 5-month plan",
          "Budget cap $150,000 USD: MET — $142,500 total",
          "Minimal downtime (< 4 hours per app): UNCLEAR — windows agreed per app in discovery",
          "Data residency in US regions: MET — us-east-1 primary, us-west-2 backup",
        ],
      },
    ],
  },
  {
    fileName: "nimbus-migration-bid.docx",
    vendorName: "Nimbus Cloud Partners",
    sections: [
      {
        title: "Executive Summary",
        body: `Nimbus Cloud Partners bids $138,000 USD for a 6-month AWS migration using parallel wave migrations. Our team of 6 includes 3 Solutions Architects and 2 DevOps engineers with AWS certifications.`,
      },
      {
        title: "Commercial Offer",
        bullets: [
          "All-in price: $138,000 USD (lowest among qualified bidders)",
          "Timeline: 6 months with transparent cost breakdown by migration wave",
          "Team size: 6 engineers",
          "Primary region: us-east-1; no data stored outside the United States",
        ],
      },
      {
        title: "Technical Approach",
        body: `Nimbus uses parallel wave migrations to optimize cost. Legacy ERP cutover may require an 8-hour maintenance window, which exceeds the RFP target of 4 hours for that application. All other applications are planned within standard maintenance windows.`,
      },
      {
        title: "Compliance Statement",
        bullets: [
          "AWS-certified migration team: MET — 3 SA + 2 DevOps certified",
          "Timeline within 6 months: MET — 6-month delivery",
          "Budget cap $150,000 USD: MET — $138,000",
          "Minimal downtime (< 4 hours per app): NOT MET — ERP may need 8-hour window",
          "Data residency in US regions: MET — us-east-1 only",
        ],
      },
    ],
  },
  {
    fileName: "apex-cloud-proposal.docx",
    vendorName: "Apex Systems Integrators",
    sections: [
      {
        title: "Executive Summary",
        body: `Apex Systems Integrators offers accelerated 4-month delivery for $155,000 USD. A dedicated pod of 10 engineers includes 5 AWS-certified specialists using automated refactoring tooling and blue/green deployments.`,
      },
      {
        title: "Commercial Offer",
        bullets: [
          "Total proposal: $155,000 USD (premium for accelerated delivery)",
          "Timeline: 4 months — fastest delivery option",
          "Team size: 10 engineers in a dedicated migration pod",
          "Year 2 support quoted separately at higher tier than peers",
        ],
      },
      {
        title: "Technical Approach",
        body: `Blue/green deployments target under 2 hours downtime per application. US-only deployment with encryption at rest via AWS KMS. Automated refactoring tooling reduces manual lift for compatible workloads.`,
      },
      {
        title: "Compliance Statement",
        bullets: [
          "AWS-certified migration team: MET — 5 AWS-certified specialists",
          "Timeline within 6 months: MET — 4-month accelerated plan",
          "Budget cap $150,000 USD: NOT MET — $155,000 (5% over cap)",
          "Minimal downtime (< 4 hours per app): MET — blue/green < 2 hours",
          "Data residency in US regions: MET — US-only, KMS encryption",
        ],
      },
    ],
  },
  {
    fileName: "primevendor-rfp-response.docx",
    vendorName: "PrimeVendor Global",
    sections: [
      {
        title: "Executive Summary",
        body: `PrimeVendor Global submits a fixed fee of $149,000 USD over 5 months aligned to RFP milestones. We offer flexible payment terms and a balanced commercial package through our regional AWS MSP partnership.`,
      },
      {
        title: "Commercial Offer",
        bullets: [
          "Fixed fee: $149,000 USD",
          "Timeline: 5 months aligned to RFP milestones",
          "Team size: 7 consultants",
          "Flexible payment terms available (quarterly invoicing option)",
          "Liability cap deviation: medium severity — see legal appendix",
        ],
      },
      {
        title: "Technical Approach",
        body: `All production workloads will run in US AWS regions. Downtime plans will be finalized during the discovery phase. AWS certifications for assigned staff are listed in appendix A.`,
      },
      {
        title: "Compliance Statement",
        bullets: [
          "AWS-certified migration team: UNCLEAR — certifications in appendix",
          "Timeline within 6 months: MET — 5-month delivery",
          "Budget cap $150,000 USD: MET — $149,000",
          "Minimal downtime (< 4 hours per app): UNCLEAR — finalized in discovery",
          "Data residency in US regions: MET — US regions only",
        ],
      },
    ],
  },
];

function sectionToParagraphs(section) {
  const children = [
    new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_2,
    }),
  ];

  if (section.body) {
    children.push(
      new Paragraph({
        children: [new TextRun(section.body)],
        spacing: { after: 200 },
      }),
    );
  }

  if (section.bullets) {
    for (const bullet of section.bullets) {
      children.push(
        new Paragraph({
          children: [new TextRun(`• ${bullet}`)],
          spacing: { after: 80 },
        }),
      );
    }
  }

  return children;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const proposal of proposals) {
    const children = [
      new Paragraph({
        text: "Response to Request for Proposal — AWS Cloud Migration",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: proposal.vendorName, bold: true }),
          new TextRun(" — Vendor Proposal"),
        ],
        spacing: { after: 300 },
      }),
      ...proposal.sections.flatMap(sectionToParagraphs),
      new Paragraph({
        children: [
          new TextRun({
            text: "Submitted for evaluation purposes — ProcureAI demo",
            italics: true,
          }),
        ],
        spacing: { before: 400 },
      }),
    ];

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(OUT_DIR, proposal.fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`Created ${outPath}`);
  }

  const readme = `# Vendor proposal test documents

Upload these files on the **Vendors** tab to test AI analysis (PDF/DOCX/TXT supported).

| File | Vendor name to use |
|------|-------------------|
| cloudtech-aws-proposal.docx | CloudTech Solutions |
| nimbus-migration-bid.docx | Nimbus Cloud Partners |
| apex-cloud-proposal.docx | Apex Systems Integrators |
| primevendor-rfp-response.docx | PrimeVendor Global |

Regenerate: \`node scripts/generate-vendor-docs.mjs\`
`;
  fs.writeFileSync(path.join(OUT_DIR, "README.md"), readme);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
