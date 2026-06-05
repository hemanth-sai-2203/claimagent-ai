# Plum OPD Claim Adjudication Tool  
## Implementation Document for the AI Automation Engineer Assignment

**Project goal:** build a real, usable OPD claims automation MVP that processes medical documents, extracts claim details, applies policy rules, and returns an explainable decision with evidence.

---

## 1) What Plum is asking for

From the assignment package, the company wants a full-stack tool that:

- accepts medical claim documents such as bills, prescriptions, and reports
- uses AI / LLMs for document understanding and extraction
- validates extracted data against policy terms and adjudication rules
- produces a final adjudication decision with reasoning
- stores claim data, extracted fields, and decisions in a structured way
- provides a clean UI for submission and review
- includes clear documentation, architecture, and a demo video

The provided materials define the problem very clearly:
- `plum_intern_assignment.md` describes the full task, deliverables, evaluation criteria, and bonus points.  
- `adjudication_rules.md` defines the decision flow, rejection reasons, fraud flags, manual review scenarios, and output format.  
- `policy_terms.json` provides the actual policy limits, waiting periods, exclusions, and document requirements.  
- `sample_documents_guide.md` shows the kinds of real-world document formats and edge cases the system must handle.  

The assignment repeatedly emphasizes that the system should work like a real insurance claims workflow, not just a basic OCR demo. It also highlights core areas such as AI integration, explainability, code quality, and user experience. fileciteturn0file4L1-L40 fileciteturn0file3L1-L20 fileciteturn0file0L1-L40 fileciteturn0file1L1-L40

---

## 2) Product idea

### Working title
**ClaimPilot AI**  
A claims operations copilot for OPD claim adjudication.

### Main idea
The system should behave like a junior claims analyst:
1. read the uploaded claim documents,
2. extract structured data,
3. check policy rules deterministically,
4. explain the outcome clearly,
5. route uncertain or suspicious claims to manual review.

### Core principle
**AI extracts. Rules decide.**

This is important because insurance decisions should be deterministic and auditable. The LLM should help with document understanding and extraction, but final approval or rejection should come from explicit rules and policy logic.

---

## 3) What the system must solve in the real world

This is not just a “submit a file and show a result” project. The actual business problem is operational:

- claims teams spend time reading bills, prescriptions, and reports manually
- they must check eligibility, limits, exclusions, and waiting periods
- they need to apply policy rules consistently
- they must explain why a claim was approved or rejected
- they must catch obvious fraud or suspicious patterns
- they need fast turnaround time with low operational effort

The adjudication document makes this workflow explicit:
- policy must be active
- waiting periods must be satisfied
- claimant must be a covered member
- documents must be valid and legible
- treatment must be covered
- limits and co-pays must be enforced
- medical necessity must be reviewed
- suspicious or high-value claims may require manual review. fileciteturn0file0L1-L40 fileciteturn0file0L80-L104

---

## 4) What we are building

### Final project scope
A lightweight but polished web app with:

- document upload
- AI-based extraction
- deterministic claim validation
- evidence-based adjudication
- confidence scoring
- manual review routing
- audit trail
- downloadable decision summary

### What we are *not* building
Because the deadline is short, the project should avoid unnecessary complexity:

- no multi-agent orchestration
- no vector database for policy text
- no complicated enterprise auth system
- no microservices
- no advanced fraud ML
- no heavy RAG pipeline unless it is clearly useful and quick to implement

For this assignment, a compact and reliable architecture is better than an over-engineered one.

---

## 5) Proposed architecture

### High-level flow

```text
User uploads claim documents
        ↓
Document ingestion
        ↓
Gemini extraction
        ↓
Structured claim JSON
        ↓
Deterministic policy validation
        ↓
Confidence + fraud heuristics
        ↓
Decision + evidence
        ↓
UI display + optional PDF export
        ↓
Audit log / saved claim record
```

### Components

#### A. Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui components

Frontend pages:
- claim upload page
- result page
- manual review queue
- claim history page

#### B. Backend
- FastAPI
- Python 3.12+

Backend responsibilities:
- accept file uploads
- send file content to Gemini for extraction
- normalize the output into a strict schema
- run rule checks
- generate final adjudication JSON
- store the claim result
- expose endpoints for UI and testing

#### C. AI layer
- Gemini 2.5 Flash or Gemini Vision-compatible model via Google GenAI SDK

AI responsibilities:
- read bills, prescriptions, and reports
- extract structured fields
- classify document type
- return strict JSON output
- provide field-level confidence where possible

Important: the AI should not make the final decision.

#### D. Rule engine
- pure Python deterministic logic

Rule engine responsibilities:
- check policy status
- check waiting period
- check member coverage
- validate document completeness
- validate doctor registration format
- check coverage, exclusions, sub-limits, and per-claim limits
- calculate co-pay and approved amount
- classify claim as approved, rejected, partial, or manual review

#### E. Storage
Minimal storage options:
- SQLite for fastest implementation
- or Supabase/PostgreSQL if already comfortable

Store:
- claim records
- extracted fields
- final decision
- audit trail
- uploaded file metadata

For a one-day submission, local storage or SQLite is acceptable if it reduces risk.

---

## 6) Final decision logic

The adjudication flow should follow the assignment rules in this order:

### Step 1: Eligibility
- policy active on treatment date
- waiting period completed
- claimant covered under policy

### Step 2: Document validation
- required documents present
- documents legible
- doctor registration visible and valid
- dates consistent
- patient details match policy record

### Step 3: Coverage check
- service is covered
- not excluded
- pre-authorization checked if needed

### Step 4: Limit validation
- annual limit
- sub-limit
- per-claim limit
- co-pay calculation

### Step 5: Medical necessity
- diagnosis justifies treatment
- prescription aligns with diagnosis
- test results support diagnosis if needed

### Step 6: Fraud / risk scan
- duplicate claim patterns
- suspicious documents
- invalid doctor registration
- unusual claim patterns
- missing or altered bills

### Step 7: Final output
Return one of:
- APPROVED
- REJECTED
- PARTIAL
- MANUAL_REVIEW

This matches the adjudication rules and output format described in the assignment. fileciteturn0file0L1-L40

---

## 7) Output format

The final API response should be structured and explainable.

### Example shape

```json
{
  "claim_id": "CLM_0001",
  "decision": "APPROVED",
  "approved_amount": 1800,
  "confidence_score": 0.94,
  "fraud_score": 0.08,
  "rejection_reasons": [],
  "evidence": [
    {
      "rule": "Policy Active",
      "status": "passed",
      "details": "Policy active on treatment date"
    },
    {
      "rule": "Per Claim Limit",
      "status": "passed",
      "details": "Claim amount within limit"
    }
  ],
  "notes": "Claim processed successfully",
  "next_steps": "No action required"
}
```

### Why this matters
The assignment values explainability and trust. The output should show:
- what was checked
- what passed or failed
- what policy clause or rule was used
- what the claimant should do next

---

## 8) Proposed implementation stack

### Recommended stack for this submission
- **Frontend:** Next.js + TypeScript + Tailwind + shadcn/ui
- **Backend:** FastAPI
- **AI extraction:** Google GenAI SDK with Gemini
- **Database:** SQLite or Supabase/PostgreSQL
- **File handling:** local uploads or Supabase Storage
- **PDF export:** jsPDF or server-generated HTML to PDF

### Why this stack
It matches the assignment’s suggested technologies and is realistic for a fast submission. The assignment explicitly recommends React/Next.js, Python backend options, Gemini/OpenAI/Claude, and common databases like PostgreSQL or MongoDB. fileciteturn0file4L1-L40

---

## 9) Data model

### Main entities

#### Claim
- claim_id
- claimant name
- member id
- treatment date
- total amount
- claim type
- status
- decision
- confidence score
- fraud score

#### Document
- document id
- claim id
- file name
- file type
- document category
- storage path

#### ExtractedFields
- claim id
- patient name
- doctor name
- doctor registration number
- diagnosis
- prescription items
- bill amount
- treatment date
- confidence metadata

#### AuditLog
- claim id
- action
- rule applied
- result
- timestamp
- details

---

## 10) Screens to build

### Screen 1: Upload and extraction
- drag-and-drop document upload
- document preview
- extraction status
- extracted JSON preview

### Screen 2: Adjudication result
- decision badge
- approved amount
- rejection reasons
- evidence list
- confidence score
- fraud score

### Screen 3: Manual review queue
- list of cases requiring human review
- filters by confidence, fraud score, and status
- reviewer action buttons

### Screen 4: Claim details
- uploaded documents
- extracted fields
- rule checks
- final audit trail

---

## 11) Suggested development order

### Phase 1: Core backend first
1. define strict claim schema
2. implement deterministic rule engine
3. test against sample JSON
4. ensure correct decisions for sample cases

### Phase 2: Gemini integration
1. upload document to backend
2. send to Gemini
3. extract structured data
4. map output to the claim schema

### Phase 3: Frontend
1. build upload page
2. display extracted fields
3. show decision and evidence
4. add manual review screen

### Phase 4: Polish
1. add confidence score
2. add audit trail
3. generate PDF summary
4. write README and demo notes

---

## 12) What makes this project strong

This project is not just a generic AI demo. It directly addresses the actual operational workflow in claims processing:

- document understanding
- rules-based adjudication
- explainable decisions
- auditability
- manual escalation
- clear evidence display

That is the right kind of solution for an AI Automation Engineer role.

The assignment also mentions that the company cares about proof of work, working code, and a clean demo more than just CV content. The strongest submission is therefore a working product with clear logic and useful UX. fileciteturn0file4L20-L40

---

## 13) Non-goals for this submission

To stay on schedule, do not expand the project into:
- a full insurance platform
- a complete policy admin system
- advanced fraud analytics
- a full RAG architecture
- multi-agent orchestration
- complex role-based access control

These are good future extensions, but they are not necessary for a strong submission tomorrow.

---

## 14) Future enhancements, if time remains

If the core system is done early, add:
- manual review queue
- PDF export of the decision report
- claim history page
- test-case runner
- policy clause display
- simple analytics dashboard

---

## 15) Final project statement

**ClaimPilot AI** is an OPD claim automation MVP that:
- extracts medical claim data using Gemini,
- applies deterministic claim rules,
- explains every decision with evidence,
- routes uncertain cases to manual review,
- and presents the result in a clean web interface.

That is the best balance of realism, speed, and technical quality for the Plum assignment.

