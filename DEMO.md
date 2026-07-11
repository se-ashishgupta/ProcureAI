# ProcureAI — Presentation Demo Scripts

Two live demo examples for hackathon presentations.

**Login (both demos):** `pm@procure.ai` / `pm123`  
**Prerequisites:** LangGraph running (`cd server && uv run langgraph dev`) and client dev server (`cd client && pnpm dev`)

---

## Demo 1 — Full Journey (Recommended Main Demo)

**Duration:** ~5 minutes  
**Shows:** Template selection → AI intake → RFP generation → vendor evaluation → award

### Story

An enterprise IT team procuring **Cloud migration to AWS** — demo vendor proposals (CloudTech, Nimbus, Apex, PrimeVendor) are pre-loaded and scored against this RFP.

### Setup

| Item | Value |
|------|--------|
| Login | `pm@procure.ai` / `pm123` |
| Title | `Cloud migration to AWS` |

### Step-by-step script

#### 1. Create event (~30 sec)

**Say:** *"Procurement starts with a plain requirement — no Word doc, no manual RFP drafting."*

Paste as **Initial requirement**:

```text
We need a vendor to migrate our legacy on-prem applications to AWS. Scope includes assessment, migration planning, execution, and post-go-live support. Budget cap $150,000 USD. Timeline within 6 months. Must use AWS-certified team, minimal downtime under 4 hours per app, and data residency in US regions only. Proposal due 30 July 2026.
```

Click **Create & open chat**.

> **Shortcut:** A seed event **Cloud migration to AWS** may already exist on the dashboard — you can open that instead of creating new.

#### 2. Select template (~30 sec)

**Say:** *"Before AI writes anything, we pick our organization's RFP structure."*

- Open **RFP chat**
- Click **NICSI — Data Analytics Platform** *(or upload your own PDF/DOCX template)*
- Show **10 sections detected**
- Click **Use this template & start RFP**

#### 3. AI intake (~1 min)

If the agent asks for more detail, paste:

```text
Organization: Acme Corp IT — migrating 12 legacy apps (Java, .NET) from on-prem VMware to AWS.

Scope: Discovery, migration runbooks, wave-based cutover, hypercare support.

Deliverables: Migration plan, AWS landing zone, migrated workloads, runbooks, knowledge transfer.

Timeline: Project start 1 Aug 2026, go-live by 31 Jan 2027 (6 months max).

Budget: $150,000 USD fixed-price cap.

Evaluation criteria: Technical approach 35%, AWS migration experience 25%, Price 25%, Timeline & team 15%.

Must-haves:
- AWS-certified migration team (Solutions Architect / Professional level)
- Minimal downtime (< 4 hours per application)
- All data in US AWS regions (us-east-1 primary)
- 12 months post-migration hypercare support
- Fixed-price commercial model
```

#### 4. Review & publish RFP (~1 min)

**Say:** *"The AI generates a vendor-ready RFP using our template sections — Factsheet, Scope, Evaluation Criteria, etc."*

- Show **Preview** panel on the right
- Point out key RFP requirements that vendors will be scored against:
  - AWS-certified team
  - Budget cap **$150,000 USD**
  - Timeline **within 6 months**
  - Downtime **< 4 hours per app**
  - **US data residency**
- Type **`confirm`** in chat → click **Resume**
- Click **Publish RFP**

#### 5. Vendor evaluation (~1.5 min)

**Say:** *"Four vendors responded with proposals — AI scores each bid against our published RFP."*

- Go to **Vendor proposals**
- Click **Load all 4 demo vendors**
- Wait ~10–30s per vendor (LangGraph analysis)

**Demo vendors (expected scores):**

| Vendor | Price | Timeline | Overall | Best for |
|--------|-------|----------|---------|----------|
| **CloudTech Solutions** | $142,500 | 5 mo | **8.7** | Top overall — under budget, certified team |
| **Nimbus Cloud Partners** | $138,000 | 6 mo | 8.3 | Lowest cost — ERP downtime risk |
| **Apex Systems Integrators** | $155,000 | 4 mo | 8.1 | Fastest — **over budget** |
| **PrimeVendor Global** | $149,000 | 5 mo | 7.6 | Mid-pack — several unclear compliance items |

**Say while showing matrix:**

> *"CloudTech scores highest overall at 8.7 — under budget with strong AWS certs. Nimbus is cheapest at $138k but flags an 8-hour ERP downtime window. Apex is fastest at 4 months but exceeds our $150k cap. PrimeVendor has documentation gaps."*

- Open **CloudTech** → **Details** → show compliance quotes (e.g. AWS-certified team, $142,500 under cap)
- Optionally open **Nimbus** → show **not_met** on downtime requirement
- Click **Award top vendor** → award **CloudTech Solutions**

### Closing line

> *"From AWS migration requirement to vendor award in under 5 minutes — with evidence-backed scores and human control at every step."*

---

## Demo 2 — Quick Contrast (Vague → Guided)

**Duration:** ~3 minutes  
**Shows:** AI advisor roadmap for exploratory buyers

### Story

A manager who **doesn't know exactly what to buy** — AI guides them first.

### Setup

| Item | Value |
|------|--------|
| Login | `pm@procure.ai` / `pm123` |
| Title | `Office Ergonomics Refresh` |
| Initial requirement | *(leave empty)* |

### Step-by-step script

#### 1. Start vague (~30 sec)

**Say:** *"Not every buyer knows the full spec upfront — our agent acts as a procurement advisor."*

- Create event → open **RFP chat**
- Select **NICSI template** (optional — or skip for speed)
- Type in chat:

```text
Our Bangalore office needs better ergonomic setup for staff. Not sure what to specify — help me figure out what we should procure.
```

#### 2. AI roadmap (~1 min)

**Say:** *"Instead of jumping to an RFP, the agent gives a roadmap and guiding questions."*

- Show agent's **roadmap** (chair types, standards, quantity, budget, timeline)
- Answer briefly:

```text
About 200 ergonomic chairs for Bangalore office. Budget around 30 lakh INR. Need delivery by end of Q3 2026. Must meet BIFMA standards. Evaluation: price 50%, warranty 30%, delivery 20%.
```

#### 3. Fast RFP + export (~1 min)

**Say:** *"Once requirements are clear, the same agent generates a vendor-ready document."*

- Show brief building in the right panel
- When RFP is ready → type **`confirm`**
- Click **PDF** or **DOCX** export

### Closing line

> *"ProcureAI works for both expert buyers and teams that need guidance first."*

---

## Side-by-side comparison

| | Demo 1 — Cloud migration to AWS | Demo 2 — Office Ergonomics |
|--|--------------------------------|----------------------------|
| **Buyer type** | Knows what they need | Exploratory / vague |
| **Highlight** | Template + 4-vendor AWS bid comparison | AI advisor roadmap |
| **Time** | ~5 min | ~3 min |
| **Wow moment** | CloudTech vs Nimbus compliance matrix | Advisor → RFP in one flow |
| **Best for** | Technical judges / full product | Business / non-technical audience |

---

## Vendor proposal files (Demo 1)

Located in `client/public/assets/vendor-proposals/`:

| Vendor | File |
|--------|------|
| CloudTech Solutions | `cloudtech-aws-proposal.docx` |
| Nimbus Cloud Partners | `nimbus-migration-bid.docx` |
| Apex Systems Integrators | `apex-cloud-proposal.docx` |
| PrimeVendor Global | `primevendor-rfp-response.docx` |

---

## Backup one-liners (if something fails)

| Issue | What to say |
|-------|-------------|
| LangGraph slow | *"AI analysis takes 10–30 seconds per vendor — real LLM, not mock."* |
| LangGraph down | Demo vendors still load with local fallback scores |
| Template parse fails | *"Falls back to 10 predefined NICSI sections."* |
| Wrong compliance scores | *"Scores are generated against whatever RFP you published — include the $150k cap and downtime SLA in your RFP for best match."* |

---

## Other demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@procure.ai` | `admin123` |
| Procurement Manager | `pm@procure.ai` | `pm123` |
| Viewer (read-only) | `viewer@procure.ai` | `viewer123` |
