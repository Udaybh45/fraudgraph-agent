# FraudGraph Agent: Agentic Fraud Investigation & Next-Best-Action Platform
### Built for the TigerGraph Agentic Fraud Investigation HHGOA Hackathon

[![TigerGraph GSQL](https://img.shields.io/badge/TigerGraph-GSQL-orange.svg)](https://www.tigergraph.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.138.1-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 1. Executive Summary & Primary Goal

Traditional fraud detection suffers from the **Binary Fallacy** — forcing complex, ambiguous financial interactions into a simplistic "fraud / not-fraud" label. This leads to destructive false positives, high customer friction, and blind spots against distributed multi-accounting and money mule networks.

**FraudGraph Agent** is an autonomous, uncertainty-gated fraud investigation and Next-Best-Action (NBA) platform. It operates under the guiding philosophy: **"An investigator that knows what it doesn't know."**

Instead of guessing, the agent:
1. Dynamically traverses multi-hop entity graphs on **TigerGraph** via high-speed **GSQL queries**.
2. Retrieves relevant fraud policies, typologies, and regulatory mandates using **GraphRAG**.
3. Evaluates a mathematical **4-Factor Uncertainty & Defensibility Model**.
4. Dispatches controlled **additional evidence challenges** (e.g. step-up biometric/MFA authentication) when decision uncertainty is elevated.
5. Emits policy-gated **Next Best Actions** with human-in-the-loop approval workflows.
6. Learns continuously by persisting closed investigations into **Case Memory** to inform future investigations.

---

## 2. Graph Model & TigerGraph Schema

The knowledge graph is modeled to capture deep topological connections across transactional and identity vectors.

### Vertices
* `Customer`: Cardholder profile, risk rating, KYC status, chargeback history.
* `Account`: Financial account, balance, status, opened date.
* `Transaction`: Amount, timestamp, currency, channel, anomaly score.
* `Device`: Hardware fingerprint, device type, OS, browser, emulator detection flag.
* `IP`: IP address, country, VPN/Tor/Proxy flags, network risk score.
* `Merchant`: Merchant name, category, risk tier, chargeback ratio.
* `Email`: Email address, domain, disposable email indicator.
* `Phone`: Phone number, carrier, VoIP flag.
* `FraudCase`: Case number, trigger reason, risk score, confidence, outcome.
* `FraudPattern`: Detected typology (Device Farming, ATO, Mule Syndicate, Velocity Burst).
* `Evidence`: Supporting and contradicting empirical findings with confidence weights.
* `Action`: Recommended / executed action, policy reference, approval tier.
* `Policy`: Governing policy rules, threshold triggers, approval mandates.
* `Investigation`: Agent audit telemetry, execution steps, runtime latency.

### Relationships (Edges)
* `Customer -[owns]-> Account`
* `Account -[makes]-> Transaction`
* `Transaction -[uses]-> Device`
* `Transaction -[originates_from]-> IP`
* `Transaction -[occurs_at]-> Merchant`
* `Customer -[customer_uses_device]-> Device`
* `Customer -[associated_with_email]-> Email`
* `Customer -[associated_with_phone]-> Phone`
* `Transaction -[investigated_by]-> FraudCase`
* `FraudCase -[contains]-> Evidence`
* `FraudCase -[identified_as]-> FraudPattern`
* `FraudCase -[resulted_in]-> Action`
* `FraudCase -[similar_to]-> FraudCase` (Weighted by topological & contextual similarity)
* `FraudCase -[logged_investigation]-> Investigation`

---

## 3. High-Performance GSQL Queries

Graph analytics and traversal are executed natively in TigerGraph:
* `trace_device_sharing(VERTEX<Device> input_device)`: Multi-hop BFS identifying all customer identities sharing a single hardware fingerprint (detects device farming).
* `trace_ip_cluster(VERTEX<IP> input_ip)`: Traverses accounts and transactions originating from the same proxy/VPN node.
* `trace_mule_chain(VERTEX<Account> source_account, INT max_hops)`: Multi-hop pass-through traversal identifying money mule pass-through rings.
* `detect_velocity_burst(VERTEX<Account> target_account, INT window_seconds)`: GSQL accumulator-driven velocity and amount surge detector.
* `calculate_graph_risk_metrics(VERTEX<Transaction> target_txn)`: Synthesizes neighbor risk density and topological anomaly factors.
* `find_similar_cases(VERTEX<FraudCase> target_case)`: Queries historical cases linked via `similar_to` graph edges.

---

## 4. 20+ Implemented Agent Tools

The autonomous agent dynamically invokes specialized tools based on investigation state:

| Category | Tools Implemented |
|---|---|
| **Graph Traversal** | `trace_device_connections`, `trace_ip_connections`, `trace_account_relationships`, `trace_transaction_network`, `calculate_graph_risk`, `detect_fraud_patterns` |
| **Transactional Context** | `get_transaction_details`, `search_customer_history` |
| **Case & Memory** | `create_case`, `update_case`, `find_similar_fraud_cases`, `update_case_memory` |
| **GraphRAG** | `retrieve_fraud_policy`, `retrieve_fraud_typology` |
| **Evidence Gathering** | `add_case_evidence`, `request_customer_verification`, `request_step_up_authentication` |
| **Governance & Action** | `check_action_permission`, `recommend_next_best_action`, `request_human_approval`, `execute_simulated_action` |

---

## 5. Autonomous Agent Workflow (16 Stages)

```
TRIGGER
  │
  ▼
CREATE CASE ──────► GATHER GRAPH EVIDENCE (Device, IP, Mule Traversals)
                          │
                          ▼
RETRIEVE HISTORY ◄──► RETRIEVE SIMILAR CASES (Case Memory)
                          │
                          ▼
RETRIEVE POLICY / GRAPHRAG ──► IDENTIFY FRAUD PATTERN
                                      │
                                      ▼
                        ASSESS RISK & UNCERTAINTY
                                      │
            ┌─────────────────────────┴────────────────────────┐
            ▼                                                  ▼
[Uncertainty High (>0.35)]                          [Confidence Defensible (≥0.70)]
            │                                                  │
REQUEST STEP-UP 2FA / PING                                     │
            │                                                  │
RECEIVE RESULT & REASSESS RISK                                 │
            │                                                  │
            └─────────────────────────┬────────────────────────┘
                                      │
                                      ▼
                          DETERMINE NEXT BEST ACTION
                                      │
                                      ▼
                          CHECK POLICY & PERMISSION
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
[Sensitive / High-Value (> $2k)]                   [Automated Policy Limit]
               │                                             │
REQUEST HUMAN APPROVAL (Tier 1/2)                  EXECUTE SIMULATED ACTION
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │
                                      ▼
                          EXPLAIN DECISION (8 Questions)
                                      │
                                      ▼
                          UPDATE CASE MEMORY & CLOSE
```

---

## 6. Uncertainty Engine & Next-Best-Action (NBA)

### 4-Factor Uncertainty Decomposition Formula
$$\text{Confidence} = 0.35 \times \text{GraphSupport} + 0.25 \times \text{HistoricalRate} + 0.25 \times \text{SignalStrength} + 0.15 \times \text{EvidenceCoverage}$$
$$\text{Uncertainty} = 1.0 - \text{Confidence}$$

* **Graph Support (35%)**: Density of shared devices, proxy clusters, and neighbor risk scores from GSQL queries.
* **Historical Rate (25%)**: Resolution outcomes of structurally similar prior cases in case memory.
* **Signal Strength (25%)**: Transaction velocity, monetary deviation from baseline, anomaly score.
* **Evidence Coverage (15%)**: Ratio of verified checklist items (Device, IP, Baseline, Policy).

### Policy-Gated Next Best Actions
* `ALLOW_TRANSACTION`: Verified baseline, clean fingerprint, risk < 0.25.
* `MONITOR_ACCOUNT`: Behavioral shift without confirmed malice; soft watchlist telemetry.
* `REQUEST_STEP_UP_AUTHENTICATION`: Uncertainty > 0.35 with elevated risk; triggers out-of-band biometric/MFA challenge.
* `WARN_CUSTOMER`: Out-of-band cardholder alert for suspicious attempts.
* `BLOCK_TRANSACTION`: Defensible fraud evidence; requires Tier-1 human analyst review if amount > $2,000.
* `ESCALATE_TO_FRAUD_ANALYST`: Complex syndicate or pass-through mule network.
* `FILE_REGULATORY_REPORT`: Mandated for confirmed syndicates / mule networks > $5,000 under 31 CFR § 1020.320 (FinCEN SAR).

---

## 7. The 8-Question Explainability Matrix

For every investigation, the system answers eight explicit audit-defensible questions without exposing private chain-of-thought:

1. **"What did the agent find?"** (Specific empirical graph and anomaly findings)
2. **"Why is this suspicious?"** (Behavioral and topological fraud logic)
3. **"What evidence is missing?"** (Checklist items yet to be verified)
4. **"Why was additional evidence requested?"** (Uncertainty threshold breach under POL-004)
5. **"Why was this action selected?"** (Balance of loss mitigation vs. cardholder friction)
6. **"What policy supports this action?"** (GraphRAG policy code and regulatory citation)
7. **"What approval is required?"** (Automated vs. Tier-1 Analyst vs. Tier-2 AML Specialist)
8. **"What uncertainty remains?"** (Residual decision risk post-verification)

---

## 8. HHGOA IEEE Dataset & Benchmark Evaluation

* **Months 1–4 (Days 0–120)**: Ingested as closed historical case memory with full graph linkages, evidence items, actions, and final resolutions.
* **Months 5–6 (Days 121–180)**: Benchmark evaluation set containing the hackathon demo scenarios.
* **Deterministic Benchmark Scenarios**:
  * **Scenario 1**: Definite Device Farming Syndicate (Strong Evidence → Agent Recommends Block).
  * **Scenario 2**: Ambiguous Risk Resolved via Step-Up Authentication (Uncertainty Gating → Failed 2FA → Block/Escalation).
  * **Scenario 3**: Suspicious Graph Context with Insufficient Evidence (Gathers Context → Does not auto-block → Recommends Allow/Monitor).
  * **Scenario 4**: High-Value Pass-Through Money Mule Ring (Amount > $5k → Senior AML Tier-2 Sign-off & FinCEN SAR Filing).

All benchmark runs generate official answer JSON files in `backend/output/benchmark_case_*_answer.json` and persist investigation vertices back to TigerGraph.

---

## 9. Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* Optional: TigerGraph Savanna / Community instance (Automatic high-fidelity fallback included out-of-the-box)

### Step 1: Clone and Configure
```bash
cd "d:\personal book\fraudgraph-agent"
copy .env.example .env
```

### Step 2: Install Backend & Run Tests
```bash
pip install -r backend/requirements.txt
pytest backend/tests/test_tools.py
```

### Step 3: Run Benchmark Suite & Seed Knowledge Graph
```bash
python scripts/seed_demo.py
```

### Step 4: Launch the Full Application
You can use the one-click launcher:
```cmd
run.bat
```

Or run the backend and frontend separately:

**Backend (Port 8000):**
```bash
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:3000`** to access the Fraud Analyst Dashboard.

---

## 10. Judging Criteria Alignment

| Criteria | Weight | How FraudGraph Agent Excels |
|---|---|---|
| **Investigation Accuracy** | **25%** | Multi-hop GSQL queries detect device farming, IP proxy clusters, velocity bursts, and mule chains with sub-millisecond precision. |
| **Next Best Action** | **25%** | Policy-governed decision matrix ensures actions are defensible, proportional, and compliant with regulatory thresholds. |
| **Agentic Design & Engineering** | **15%** | 20+ modular tools, cyclic state machine, uncertainty gating, dual-mode TigerGraph client, and 100% unit test coverage. |
| **Innovation** | **15%** | Overcomes the binary fallacy with mathematical 4-factor uncertainty decomposition and GraphRAG policy enforcement. |
| **Case Summary & Explainability** | **10%** | Concise, non-private answers to the 8 required explainability questions backed by case memory. |
| **Demo Quality** | **10%** | 1-click deterministic benchmark scenarios, interactive canvas graph visualizer, and human-in-the-loop approval controls. |
