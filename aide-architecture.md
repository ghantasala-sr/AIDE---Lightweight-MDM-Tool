# AIDE — AI-Driven Identity Engine

Pivot from "single-customer engagement" to an actual product: customer connects/uploads their own data sources through a frontend, and AI does the schema mapping + identity-resolution setup that a solutions engineer would normally do by hand.

---

## 1. Product Pitch

> "Connect your data sources. Our AI figures out how your customer records relate to each other, proposes a unified schema, and lets you review and launch a governed golden-record pipeline — in minutes, not the weeks a solutions engineer would normally spend on manual field mapping."

This is literally productizing FDE/solutions-engineering work with AI — a very strong, current story for Forward Deployed AI Engineer roles specifically, because you're demonstrating the exact skill (translating a customer's messy reality into a working system) except automated.

---

## 2. User Flow (this IS the product)

**Step 1 — Connect or Upload**
User adds 2+ data sources via:
- File upload (CSV export, or a schema DDL dump) — simplest to build first
- Direct DB connection (Postgres connection string) — stretch goal, more impressive if you get to it

**Step 2 — AI Schema Profiling**
System introspects each source: table/column names + a sample of rows (10–20, not full data). An LLM call analyzes this and returns, per column:
- Inferred semantic type (email, phone, full_name, first_name, company_name, currency_amount, date, status_enum, unique_id, etc.)
- Confidence score
- A guess at whether this column could be a matching key

**Step 3 — AI-Proposed Canonical Mapping**
Given semantic types across all sources, the AI proposes a canonical golden schema (e.g., "email appears in 3 of your 4 sources — I'll use it as the primary match key") and a field-mapping config, plus draft survivorship rules ("billing_service.plan will win over any conflicting plan field, since it's the only source with plan data").

**Step 4 — Human Review (frontend, this is the key UI)**
A review screen: each AI suggestion shown as an editable card — accept, edit, or reject. This is deliberately NOT fully autonomous — human-in-the-loop review is itself part of your "governed AI" story (an ungoverned system would just apply the mapping silently).

**Step 5 — Run Identity Resolution**
Once mapping is approved, the matching engine runs using the approved config, producing golden profiles with confidence scores + field provenance (same as v1 design).

**Step 6 — Dashboard**
Table/detail view of golden profiles, match confidence, and per-field provenance. Click into any profile to see which source rows were merged and why.

**Step 7 — AI Decisioning + Audit Trail**
Same as v1: LangGraph agent makes GTM decisions on golden profiles, every decision logged with reasoning + source lineage.

**Step 8 — Activation**
Same as v1: push decisions to mock/real downstream connectors (Slack, email, ads).

---

## 3. Architecture

```
                         [React Frontend]
        (upload/connect, review mapping, dashboard, audit viewer)
                                |
                    [orchestrator-api] (Spring Boot)
              handles: source registration, job orchestration,
                    serves mapping configs to frontend
                    /            |              \
    [schema-profiler-service] [identity-resolution-service] [ai-decisioning-service]
     (Python/FastAPI + LLM)      (Java or Python, config-driven)     (LangGraph)
            |                            |                              |
     [source connectors]          [golden-profile-store]         [audit-trail-store]
     (CSV parser / JDBC)                                                |
                                                                 [activation-service]
```

- `orchestrator-api` (Spring Boot) — this is your Java/Spring Boot centerpiece: manages source registration, kicks off profiling + resolution jobs, exposes REST APIs the frontend calls. This is the "product backend."
- `schema-profiler-service` (Python) — takes column names + sample values, calls Claude with a structured-output prompt, returns semantic types + mapping proposals. This is the core AI differentiator.
- `identity-resolution-service` — same matching/survivorship logic as v1, but now **reads its config from what the user approved in Step 4** instead of hardcoded mappings. This is what makes it genuinely multi-customer/self-serve.
- `ai-decisioning-service` + `activation-service` — unchanged from v1.
- Frontend: React, the review-and-approve screen is the single most important piece of UI to get right — it's what makes this feel like a product instead of a script.

---

## 4. The AI Schema-Profiling Prompt (the core trick)

For each column, send the LLM: column name, source table name, and ~15 sample values (redact anything too sensitive, or use synthetic data throughout). Ask for structured JSON output:

```json
{
  "column": "cust_eml",
  "inferred_semantic_type": "email",
  "confidence": 0.97,
  "is_candidate_match_key": true,
  "reasoning": "Values match email format (contains @, valid domain patterns); column name abbreviation 'eml' is a common shorthand for email"
}
```

Do this per-column, then a second LLM pass across ALL columns from ALL sources together to propose the cross-source mapping (e.g., "source_a.cust_eml, source_b.email_address, and source_c.contact_email all map to canonical field: email").

This two-pass approach (per-column inference, then cross-source reconciliation) is worth calling out explicitly in interviews — it's a real pattern for schema-matching problems, not just "throw it all at one prompt."

---

## 5. Identity Resolution Matching Logic (Detailed)

This is the trickiest logic in the whole system — worth specifying precisely rather than leaving it as "fuzzy matching happens here."

### Matching pipeline (runs per pair of candidate records across sources)

**Stage 1 — Blocking (reduce the comparison space).**
Comparing every record to every other record across sources is O(n²) and wasteful. First, group records into "blocks" that share something cheap to compare (e.g., same normalized email domain, same first 3 letters of last name + same zip). Only compare records *within* a block. This is standard practice in real MDM/record-linkage systems and worth naming explicitly — it shows you know this isn't a toy brute-force join.

**Stage 2 — Deterministic matching (high confidence, cheap).**
Within a block, check for exact matches on the field(s) the schema-profiler flagged as `is_candidate_match_key` (usually normalized email — lowercase, trimmed). Exact match on a strong key → auto-match, confidence = 1.0.

**Stage 3 — Probabilistic/fuzzy matching (fallback for the rest).**
For records with no exact key match, score similarity across multiple fields and combine into one confidence score:
- Name similarity: Jaro-Winkler distance (handles typos, nicknames better than Levenshtein for names)
- Company/organization similarity: token-based similarity (handles "Acme Inc" vs "Acme, Incorporated")
- Address similarity: normalize first (strip suite/apt numbers, standardize abbreviations) then compare
- Combine into a weighted score, e.g.: `0.5 * name_sim + 0.3 * company_sim + 0.2 * address_sim`
- Threshold: score ≥ 0.85 → auto-match; 0.6–0.85 → flagged for human review (a "possible match" queue in the dashboard); < 0.6 → treated as distinct records

**Stage 4 — Survivorship (merge the matched records into one golden record).**
Apply the rules from the approved field-mapping config (Section 4): each canonical field pulls from whichever source was designated authoritative for it. Store the source in `field_provenance` for every field, always — this is what makes "why does this golden record say X" answerable.

### Handling the review queue (0.6–0.85 confidence band)

This is a good UI moment, not just backend logic: surface "possible matches" as a side-by-side comparison card (record A vs record B, fields that agree in green, fields that conflict in red) with Merge / Not a Match buttons. This queue is also where the `regulated` sensitivity tier (Section 9) tightens the auto-match threshold — e.g., raise the auto-match bar from 0.85 to 0.95 for regulated sources, pushing more matches into human review by design.

### What NOT to over-build

Real MDM platforms (Reltio, Informatica MDM) support dozens of matching algorithms, ML-trained matchers, and manual rule editors. For a portfolio project, the rule-based pipeline above is enough to demonstrate the concept correctly — don't burn build time on a trained ML matcher unless you finish everything else early.

---

## 6. Review & Approve UI (the "aha moment" screen)

This is the single UI surface most worth designing carefully — it's what turns AIDE from "a script that ran" into "a product someone would trust."

### Screen 1 — Mapping Review (after Step 3 in the user flow)

Layout: one card per canonical field the AI proposed (e.g., "email"), showing:
- Which source columns it pulled together (`crm.cust_eml`, `billing.email_addr`, `support.contact_email`)
- AI's confidence per column mapping
- A one-line AI-generated reasoning string (not just a number — "matched on column name similarity and email-format sample values")
- Three actions per card: **Accept**, **Edit** (dropdown to remap to a different canonical field or exclude the column), **Reject**
- A visible running count: "12 of 15 columns mapped, 3 need your review" — keeps the human oriented, and low-confidence items should auto-sort to the top so review time is spent where it matters

### Screen 2 — Possible-Matches Queue (from Stage 3 above)

Side-by-side record comparison, agreeing fields highlighted, conflicting fields flagged, with Merge / Not-a-Match actions. This screen is optional for a v0 build (you can auto-decide at fixed thresholds initially) but is a strong "phase 2" addition since it visually demonstrates the human-in-the-loop governance story.

### Screen 3 — Golden Profile Dashboard

Searchable/filterable table of resolved profiles (name, confidence, source count, last updated). Click a row → detail view showing every field with its provenance source, plus a version history if you build the versioning from Section 8 above. This is your primary demo screen — the payoff of everything upstream.

### Build-order note

Screen 1 is not optional — it's the core product moment, build it first and make it good. Screens 2 and 3 can start as plain tables and get polish later; don't spend early design time on them.

---

## 7. Data Model Additions (vs v1)

**`source_registration`**
```json
{
  "source_id": "uuid",
  "customer_id": "uuid",
  "source_name": "Mindbody CRM export",
  "connection_type": "csv_upload | jdbc",
  "sensitivity_tier": "standard | regulated",
  "raw_schema": { "columns": ["cust_eml", "cust_nm", "...": "..."] }
}
```
`sensitivity_tier` is set at registration time and drives the compliance behaviors described in Section 9 — `regulated` sources automatically require purpose-tagging, stricter match thresholds, and mandatory human review.

**`field_mapping_proposal`** (AI-generated, human-editable)
```json
{
  "source_id": "uuid",
  "column": "cust_eml",
  "ai_suggested_canonical_field": "email",
  "ai_confidence": 0.97,
  "human_status": "approved | edited | rejected",
  "final_canonical_field": "email"
}
```

This table is your audit trail for the *setup* process, separate from the AI-decisioning audit trail — worth having both, since "governed AI" here means governing both the AI that sets up the pipeline AND the AI that acts on it.

---

## 8. Delivery Layer — Persistence, Versioning & Getting Data to the Customer

Resolving identity once isn't the finish line — source data keeps changing, so golden records need to behave like a living dataset, and customers need a real way to get the unified data back out.

### Persistence & versioning

- **Golden profile store** (Postgres or BigQuery): one row per resolved customer, keyed by `golden_id`.
- **Never overwrite on re-run.** Each time identity resolution runs (nightly batch, or triggered by new source uploads), write a new row with `version_id` + `resolved_at`, and flag the latest as `is_current`. This lets you demo "this record changed on July 3rd because billing-service updated the plan field" — a concrete, traceable story.
- **Full re-run over incremental matching.** True incremental identity resolution is a hard problem even in production MDM tools — for a portfolio project, scheduled full re-runs are simpler to build and still demonstrate the concept correctly.

### Delivery methods (build in this order — each is a small increment on the last)

| Method | Effort | What it demonstrates |
|---|---|---|
| In-app dashboard | Low | Browse/search golden profiles, inspect provenance |
| CSV/Excel export | Low | Tangible "download your unified customer list" moment |
| REST API (`GET /golden-profiles`, `/golden-profiles/{id}`) | Medium | Programmatic access — also needed internally by `ai-decisioning-service`, so exposing it externally is nearly free |
| Reverse sync into a source system | Medium-High | "Closes the loop" — clean data written back into the same messy CRM it came from |
| Data warehouse sync (BigQuery) | Medium | "Unified data lands in your own warehouse" — recognizable to any data/GTM audience |
| Real-time activation (Slack/email/ads) | Medium | Different use case: per-decision push, not bulk data access (already covered in Step 8 above) |

**Recommended stretch goal:** BigQuery warehouse sync over reverse-sync-into-CRM — it's less fragile to demo live and is immediately understood by a data-engineering or GTM audience without needing to explain a fake CRM's internals.

---

## 9. Compliance & Governance Features (HIPAA-Ready by Design, Not a Separate Build)

Rather than building a separate "healthcare version," the compliance-grade features below are built into the core generic platform as configuration, not forked code. Any customer can turn them on; a healthcare customer just needs them on by default. This is the stronger engineering claim: one platform, governance depth that happens to satisfy a regulated industry's requirements.

### Entity mapping (illustrative — shows the same core objects work across domains)

| AIDE concept | Generic (GTM) | Healthcare |
|---|---|---|
| Silo service | CRM/billing/support | EHR / revenue-cycle / patient portal |
| Golden profile | Unified customer record | Master Patient Index (MPI) record |
| Identity resolution | Customer matching | Patient matching |
| Decisioning agent | Churn-risk / expansion flags | Care-gap / eligibility flags |
| Activation layer | Ads/email/Slack push | Interoperability exchange (referral partner, payer, public health agency — same role TEFCA plays nationally) |

### Relevant compliance frameworks to design against (not implement fully — know and reference correctly)

- **HIPAA Privacy Rule** — governs use/disclosure of PHI; relevant to what the activation layer is allowed to send and to whom.
- **HIPAA Security Rule** — mandates encryption at rest/in transit, access controls, and audit logging. Your core audit-trail design already satisfies the spirit of this — it just needs to be "on" for every customer, not healthcare-specific.
- **HITECH Act** — extended HIPAA enforcement; context for why this space is federally prioritized.
- **21st Century Cures Act / Information Blocking Rule (ONC)** — the regulatory backbone behind why interoperability (your activation layer's real-world analog, TEFCA) is a funded national priority right now.
- **42 CFR Part 2** — stricter consent rules for substance-use records, worth a one-line mention if your synthetic dataset includes sensitive categories.
- **SOC 2 / HITRUST CSF** — baseline and healthcare-specific trust certifications a real vendor would pursue; mention as "designed to be SOC 2-ready" even without pursuing certification for a portfolio project.
- **GDPR-style right-to-access/erasure** — if you want the platform to read as compliant beyond just US healthcare, the same audit/access design maps cleanly onto data-subject-access-request patterns too — another reason to build it as a generic feature, not a healthcare special case.

### The four generic features that make this true (build these into the core platform, on by default, configurable per customer)

1. **Read-access audit logging.** Every read of a golden profile — not just every AI decision — gets logged: who, when, why (`access_reason` field). This is HIPAA's "minimum necessary" principle, but it's genuinely good practice for any customer handling sensitive data (financial, GTM, or medical).
2. **Purpose-tagging on every activation event.** An `exchange_purpose` field (e.g. `treatment`, `marketing`, `payment`, `care_coordination`, `billing`) required on every outbound push. Mirrors TEFCA's requirement that every exchange declare a defined purpose — and it's just good governance for a generic product too (an interviewer will recognize this as the same idea behind purpose limitation in GDPR).
3. **Encryption as a stated default, not an afterthought.** TLS in transit, Cloud SQL encryption at rest, secrets in GCP Secret Manager — true for every deployment regardless of industry, but explicitly documented as a compliance-driving decision.
4. **Configurable sensitivity tier per data source.** When a customer registers a source (Step 1 of onboarding), they tag it with a sensitivity level (`standard` / `regulated`). `regulated` sources automatically require: purpose-tagging on all reads, stricter matching confidence thresholds before auto-approving a merge, and mandatory human review of AI decisions (no auto-fire). This single config flag is what turns "generic MDM" into "HIPAA-ready MDM" without any forked logic — worth designing this explicitly, it's the cleanest way to tell the story in an interview.

### Framing for interviews

> "The platform is domain-agnostic by design — the same identity-resolution and governance engine works whether the customer is a SaaS company unifying CRM data or a hospital unifying patient records. I validated that by building in a `regulated` sensitivity tier that activates HIPAA-aligned behaviors — purpose-tagged exchanges, mandatory human review, stricter match thresholds — as configuration, not a fork. It's the same pattern GDPR-style purpose limitation uses, so the same feature covers multiple regulatory contexts."

This is a stronger claim than either "generic platform" or "healthcare platform" alone — it demonstrates you can design governance as a first-class, reusable primitive rather than bolting on compliance per industry.

---

## 10. Sequential Build Scope — v0 (Simple) → v1 → v2

Structured so you can ship a working, demoable version fast, then layer in the more impressive pieces without re-architecting anything already built.

### v0 — Minimum working version (get this end-to-end first)

Goal: prove the core loop works, even if every piece is the simplest possible version of itself.

- 2 hardcoded CSV sources (not upload yet — just two sample files in the repo)
- `schema-profiler-service`: single LLM call per column, no batching optimization yet
- Field mapping: AI proposes it, but skip the review UI — just print/log the proposed mapping and manually confirm it in code
- `identity-resolution-service`: Stage 2 only (exact email match) — skip fuzzy matching entirely
- Golden profile store: single table, no versioning yet
- No dashboard yet — query the table directly to verify it worked
- No AI decisioning, no activation yet

This alone proves: AI can look at two messy schemas and correctly figure out they both have an "email" field, and merge two customer records into one. That's the whole thesis of the product, working end-to-end, in the smallest possible form.

### v1 — Product-shaped version

- Real file upload (not hardcoded files) via `orchestrator-api`
- Cross-source mapping proposal (second LLM pass, Section 4)
- **Screen 1 (Mapping Review UI)** — build this properly, it's the product's core moment (Section 6)
- Fuzzy matching (Stage 3, Section 5) with the 0.6–0.85 review-queue threshold logic
- Golden profile dashboard (Screen 3) — plain table is fine
- Basic OpenTelemetry tracing across the services you have so far

### v2 — Full story (compliance, decisioning, activation, polish)

- `ai-decisioning-service` (LangGraph) + audit trail
- `sensitivity_tier` config + the four compliance features (Section 9)
- Real activation: at least one live connector (Slack webhook is easiest and most demoable)
- Versioning on the golden profile store (Section 8)
- CSV export + REST API for golden profiles (Section 8)
- Screen 2 (possible-matches queue UI)
- Full Datadog dashboard tying traces across the whole pipeline
- Deploy everything to Cloud Run

### What to explicitly skip unless everything above is done early

- Direct DB connections (stick with CSV upload)
- Reverse-sync back into a source system
- BigQuery warehouse sync
- ML-trained matcher (the rule-based pipeline is sufficient)

---

## 11. Resume Framing

> Built **AIDE (AI-Driven Identity Engine)**, a self-serve MDM platform where customers upload arbitrary data sources and an LLM-based schema-profiling pipeline infers semantic field types and proposes cross-source identity-resolution mappings for human review — productizing manual solutions-engineering work with AI. Spring Boot orchestration backend, Python/LangGraph AI layer, React review UI, full decision audit trail, deployed on GCP with OpenTelemetry/Datadog observability.

This sentence is doing double duty: it shows product thinking (self-serve, UI, human-in-the-loop) AND the FDE-flavored insight (AI replacing manual mapping work) AND your full stack (Spring Boot + Python AI + React + GCP + observability).

---

## Open Design Decisions

- CSV-only for v1, or attempt direct DB connections too? (CSV is much faster to build and still demos well.)
- Where does `field_mapping_proposal` review UI live — a dedicated screen, or inline in the upload flow? (Dedicated screen recommended — it's the product's "aha" moment, give it room.)
- Single LLM call per column vs. batching all columns from one source into one call (cheaper, faster, but slightly less accurate individually) — worth prototyping both before committing.
