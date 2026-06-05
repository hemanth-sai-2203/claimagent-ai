# ClaimPilot AI — Automated Claims Adjudication System

This is the final submission for the Plum Assignment. **ClaimPilot AI** is a deterministic, AI-assisted claims adjudication system that processes medical documents, extracts structured data, and evaluates claims against a defined insurance policy to provide an instant `APPROVED`, `PARTIAL`, `MANUAL_REVIEW`, or `REJECTED` decision.

## 🚀 Tech Stack
- **Backend:** FastAPI, Python 3.12, SQLite (via SQLAlchemy & Alembic)
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **AI Extraction:** Google Gemini 2.5 Flash (via `gemini-2.5-flash` model with Structured JSON Output)
- **Architecture:** Monolithic REST API + Serverless Frontend

## 📐 Architecture Diagram

```mermaid
graph TD
    A[User/Reviewer] -->|Uploads PDF & Form| B(Next.js Frontend)
    B -->|POST /documents/upload| C(FastAPI Backend)
    B -->|POST /claims/extract| C
    
    C -->|Sends PDF Base64| D[Gemini 2.5 Flash]
    D -.->|Returns Structured JSON| C
    
    B -->|POST /adjudication/| C
    C --> E{Rules Engine Workflow}
    
    E --> F1(1. Eligibility Check)
    E --> F2(2. Document Verification)
    E --> F3(3. Coverage & Exclusions)
    E --> F4(4. Financial Limits & Copay)
    E --> F5(5. Medical Necessity)
    E --> F6(6. Fraud Detection)
    E --> F7(7. Final Decision & Confidence)
    
    F7 --> G[(SQLite Database)]
    C -.->|Returns Adjudication Result| B
```

## 🧠 Decision Logic Flowchart

```mermaid
flowchart TD
    Start([Receive Claim Payload]) --> E1{Policy Active?}
    E1 -- No --> R1([REJECT: Policy Expired])
    E1 -- Yes --> E2{Waiting Period Met?}
    E2 -- No --> R2([REJECT: Waiting Period Active])
    E2 -- Yes --> D1{Prescription Present?}
    
    D1 -- No --> R3([REJECT: Missing Documents])
    D1 -- Yes --> C1{Treatment Excluded?}
    
    C1 -- Yes --> R4([REJECT: Excluded Service])
    C1 -- No --> C2{Needs Pre-auth?}
    
    C2 -- Yes --> R5([REJECT: Pre-auth Required])
    C2 -- No --> L1{Within Claim Limit?}
    
    L1 -- No --> P1([PARTIAL APPROVAL: Capped at Limit])
    L1 -- Yes --> F1{Fraud Flags > Threshold?}
    
    F1 -- Yes --> M1([MANUAL REVIEW])
    F1 -- No --> F2{Previous Claims Same Day > 1?}
    
    F2 -- Yes --> M1
    F2 -- No --> A1([APPROVED])
    
    P1 --> Calc[Apply 10% Copay / Network Discount]
    A1 --> Calc
    M1 --> Calc
```

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env      # Add your GEMINI_API_KEY
alembic upgrade head      # Run migrations
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Running Automated Tests
```bash
cd backend
python -m tests.run_test_cases
```
*Note: All 10 provided test cases currently pass with 100% accuracy.*

## 💡 Key Assumptions
1. **Gemini Extraction Output**: We assume that Gemini 2.5 Flash will consistently return the required fields (`consultation_fee`, `medicines`, etc.) as strictly numerical data (which is enforced via structured output schemas).
2. **Document Linking**: A single `document_id` links to the claim, and the user uploads the combined prescription+bill as a single file.
3. **Database**: We use SQLite for simplicity and local reviewability. In production, this would be swapped to PostgreSQL.
4. **Member Database**: Since we don't have a live member database, policy conditions (like joining date) are supplied directly from the frontend form.

## ✨ Bonus Features Implemented (100% Complete)
- **Appeals Workflow**: Users can appeal a rejected or partially approved claim, routing it instantly to the Manual Review queue for an officer.
- **Admin Policy Dashboard**: Officers can dynamically edit the `policy_terms.json` directly from the browser, immediately updating the backend rules engine.
- **AI Analytics Dashboard**: Real-time evaluation metrics tracking AI confidence scores, approval distributions, and top fraud flags.
- **Downloadable Decision Letter (PDF)**: Native, print-friendly CSS export for users to download their Explanations of Benefits (EOB).
- **AI Confidence Score**: Calculated based on the number of documents provided vs required and the presence of fraud flags.
- **Manual Review UI**: Reviewers can filter claims requiring manual intervention, see exact rule evidence, and submit a final Approval/Rejection.
- **Fraud Detection**: Heuristics applied if a patient submits multiple claims on the exact same day.
