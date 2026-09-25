# FraudGraph Agent

**Autonomous Fraud Investigation and Next-Best-Action Platform powered by TigerGraph Savanna**
Built for the HHGOA x TigerGraph Hackathon

Live Demo: https://fraudgraph-agent-1.onrender.com/
API Health: https://fraudgraph-agent-1.onrender.com/api/health
API Docs: https://fraudgraph-agent-1.onrender.com/docs

LLM: Google Gemini 1.5 Pro
Agent Framework: AutoGen
Graph DB: TigerGraph Savanna

---

## Hackathon Answer Files

All 20 case answer files are in the `cases/` folder at the repository root:

```
cases/
  HHG-001.json   Device Farming Syndicate            -> BLOCK
  HHG-002.json   Account Takeover (Unrecognized Dev) -> BLOCK
  HHG-003.json   Legitimate Travel Anomaly           -> ALLOW
  HHG-004.json   Money Mule SAR Threshold            -> ESCALATE
  HHG-005.json   Card Testing Velocity Burst         -> BLOCK
  HHG-006.json   Low-Risk Grocery Purchase           -> ALLOW
  HHG-007.json   Structuring / Smurfing              -> ESCALATE
  HHG-008.json   SIM Swap Account Takeover           -> BLOCK
  HHG-009.json   Crypto Off-Ramp Laundering          -> ESCALATE
  HHG-010.json   Recurring Subscription              -> ALLOW
  HHG-011.json   Multi-Device Farming Ring           -> BLOCK
  HHG-012.json   Foreign IP Legitimate Travel        -> ALLOW
  HHG-013.json   Business Email Compromise           -> ESCALATE
  HHG-014.json   Chargeback Ring                     -> BLOCK
  HHG-015.json   Micro-Transaction Probe (Benign)    -> ALLOW
  HHG-016.json   Shell Company Mule Chain            -> ESCALATE
  HHG-017.json   3AM High-Value ATO                  -> BLOCK
  HHG-018.json   Known Good Customer                 -> ALLOW
  HHG-019.json   Darknet Market Transaction          -> ESCALATE
  HHG-020.json   Mule Account Pass-Through           -> BLOCK
```

---

## What It Does

FraudGraph Agent is a fully autonomous, uncertainty-gated fraud investigation system that:

1. Receives a flagged transaction alert (trigger event)
2. Traverses TigerGraph's fraud knowledge graph using GSQL queries for multi-hop entity relationships
3. Identifies the fraud pattern (Device Farming, Money Mule, ATO, Structuring, BEC, etc.)
4. Retrieves governing policies and typologies via a GraphRAG pipeline
5. Calculates a Bayesian uncertainty score over the collected evidence
6. Requests step-up authentication when evidence is ambiguous
7. Determines the Next Best Action: BLOCK / ALLOW / ESCALATE
8. Enforces human-in-the-loop for high-value or high-uncertainty decisions
9. Explains every decision via an 8-question XAI matrix
10. Persists outcomes to TigerGraph FraudCase vertices for continuous case memory learning

---

## Architecture

```
[ React Frontend (Vite + Tailwind) ]
         |
[ FastAPI REST API ]  <-->  [ AutoGen Agent Orchestrator ]
         |                          |
         |                 [ Tool Layer ]
         |              case_tools | evidence_tools
         |              graph_tools | action_tools
         |                          |
[ TigerGraph Savanna Cloud Graph ]
  Customer -> Account -> Transaction -> Device -> IP -> Merchant
  FraudCase -> Evidence -> FraudPattern -> Action -> Policy
  GSQL: trace_device_sharing | trace_ip_cluster
        detect_fraud_patterns | calculate_graph_risk
        trace_account_relationships | trace_transaction_network
         |
[ GraphRAG Policy Store ] | [ Case Memory (Vector) ] | [ Gemini LLM ]
```

### Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Graph DB         | TigerGraph Savanna (Cloud)          |
| Query Language   | GSQL (multi-hop subgraph traversal) |
| LLM              | Google Gemini 1.5 Pro               |
| Agent Framework  | AutoGen (multi-tool orchestration)  |
| Backend          | FastAPI (Python 3.11)               |
| Frontend         | React 18 + Vite + Tailwind CSS      |
| Deployment       | Render.com                          |

---

## TigerGraph Schema

14 vertex types, 16 edge types:

**Vertices:** Customer, Account, Transaction, Device, IP, Merchant, Email, Phone, FraudCase, FraudPattern, Evidence, Action, Policy, Investigation

**Edges:** owns, makes, uses, originates_from, occurs_at, customer_uses_device, associated_with_email, associated_with_phone, investigated_by, contains, identified_as, resulted_in, similar_to, logged_investigation, enforces_policy

### Key GSQL Queries

| Query                       | Purpose                                                         |
|-----------------------------|-----------------------------------------------------------------|
| trace_device_sharing        | Multi-hop device -> customer traversal (device farming rings)   |
| trace_ip_cluster            | IP -> transaction -> account cluster (anonymized network flags) |
| detect_fraud_patterns       | Subgraph pattern matching against known typologies              |
| calculate_graph_risk        | Aggregated graph-topology risk score (PageRank-inspired)        |
| trace_account_relationships | N-hop account chain traversal (mule pass-through rings)         |
| trace_transaction_network   | Full 2-hop subgraph extraction for analyst visualization        |

---

## Agent Workflow (17 Steps)

```
TRIGGER
  -> CREATE_CASE
  -> INVESTIGATE (transaction details)
  -> GATHER_GRAPH_EVIDENCE x4 (device, IP, account, network)
  -> RETRIEVE_TRANSACTION_HISTORY
  -> IDENTIFY_FRAUD_PATTERN
  -> RETRIEVE_POLICY_GRAPHRAG
  -> RETRIEVE_SIMILAR_CASES
  -> ASSESS_UNCERTAINTY
     [if uncertainty > 0.10]
       -> REQUEST_STEP_UP_AUTH
       -> RECEIVE_RESULT
       -> REASSESS_RISK
  -> DETERMINE_NEXT_BEST_ACTION
  -> CHECK_POLICY_PERMISSION
  -> AUTOMATED_EXECUTE or REQUEST_HUMAN_APPROVAL
  -> EXPLAIN_DECISION (8-question XAI)
  -> UPDATE_CASE_MEMORY
  -> CLOSE
```

### Decision Thresholds

| Risk Score | Uncertainty | Step-Up Result | Action                    |
|------------|-------------|----------------|---------------------------|
| >= 0.85    | any         | FAILED         | BLOCK_TRANSACTION         |
| >= 0.85    | any         | —              | ESCALATE_TO_FRAUD_ANALYST |
| 0.60-0.85  | > 0.10      | FAILED         | BLOCK_TRANSACTION         |
| 0.60-0.85  | > 0.10      | PASSED         | ALLOW_TRANSACTION         |
| < 0.30     | < 0.15      | PASSED         | ALLOW_TRANSACTION         |

---

## Fraud Patterns Covered (20 Cases)

| Pattern                       | Count | Cases                         |
|-------------------------------|-------|-------------------------------|
| Device Farming / Multi-Acct   | 2     | HHG-001, HHG-011              |
| Account Takeover              | 4     | HHG-002, HHG-008, HHG-012, HHG-017 |
| Money Mule Pass-Through       | 3     | HHG-004, HHG-016, HHG-020    |
| Money Laundering              | 2     | HHG-009, HHG-019              |
| Card Testing & Velocity Burst | 2     | HHG-005, HHG-006              |
| Structuring / Smurfing        | 1     | HHG-007                       |
| Business Email Compromise     | 1     | HHG-013                       |
| Friendly Fraud / Chargeback   | 1     | HHG-014                       |
| Benign Activity               | 4     | HHG-003, HHG-010, HHG-015, HHG-018 |

---

## Scoring Summary

| Outcome                    | Count | Cases                              |
|----------------------------|-------|------------------------------------|
| BLOCK_TRANSACTION          | 8     | 001, 002, 005, 008, 011, 014, 017, 020 |
| ALLOW_TRANSACTION          | 6     | 003, 006, 010, 012, 015, 018       |
| ESCALATE_TO_FRAUD_ANALYST  | 6     | 004, 007, 009, 013, 016, 019       |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- TigerGraph Savanna account

### 1. Clone

```bash
git clone https://github.com/Udaybh45/fraudgraph-agent.git
cd fraudgraph-agent
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your TigerGraph Savanna credentials and Gemini API key
```

### 3. Run Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Generate All 20 Case Answer Files

```bash
python generate_cases.py
```

---

## REST API Reference

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/health                 | System health + TigerGraph status    |
| GET    | /api/benchmarks             | List benchmark cases                 |
| GET    | /api/cases                  | List all cases                       |
| GET    | /api/cases/{id}             | Case investigation details           |
| POST   | /api/investigate            | Trigger autonomous investigation     |
| POST   | /api/cases/{id}/approve     | Human analyst approve/override       |
| GET    | /api/graph/{txn_id}         | Transaction subgraph from TigerGraph |
| GET    | /api/policies               | Fraud policies and typologies        |
| GET    | /api/case-memory/similar    | Find similar historical cases        |

---

## Project Structure

```
fraudgraph-agent/
  cases/                   20 hackathon answer files (HHG-001 to HHG-020)
  case_pack.csv            Case manifest (all 20 case definitions)
  generate_cases.py        Script to regenerate answer files
  backend/
    app.py                 FastAPI application and REST endpoints
    agent/
      workflow.py          17-step autonomous agent workflow
      state.py             Pydantic InvestigationState model
      reasoning.py         Gemini LLM 8-question explainability engine
    tigergraph/
      client.py            TigerGraph Savanna pyTigerGraph client
      graph_store.py       In-memory emulator fallback
      schema.gsql          Full GSQL schema (14V + 16E)
      queries.gsql         Analytical GSQL queries
    tools/                 Agent tool registry (graph, case, evidence, action)
    graphrag/              Policy and typology GraphRAG store
    memory/                Case memory and similarity search
    uncertainty/           Bayesian uncertainty calculation engine
    nba/                   Next Best Action determination engine
    dataset/               IEEE-CIS HHGOA dataset generator and loader
    output/                Benchmark run outputs
  frontend/
    src/components/        React UI components (Header, Sidebar, RiskGauge, etc.)
  render.yaml              Render.com deployment config
  .env.example             Environment template
```

---

## TigerGraph Deployment: Savanna

- Graph: FraudGraph
- Vertices: 14 types
- Edges: 16 types
- GSQL Queries: 6 installed analytical queries
- Fallback: High-fidelity in-memory emulator when Savanna is unreachable

---

## Built At

Hacker House Goa (HHGOA) x TigerGraph Hackathon 2026

- LLM: Google Gemini 1.5 Pro
- Agent Framework: AutoGen (Microsoft)
- Graph DB: TigerGraph Savanna
- Deployment: Render.com

---

## License

MIT License
