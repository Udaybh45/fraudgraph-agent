import os
import sys
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from config import settings
from dataset.loader import load_dataset_into_graph, DATASET_DIR
from dataset.generator import generate_hhgoa_ieee_dataset
from tigergraph.client import tg_client
from tigergraph.graph_store import graph_store
from memory.case_memory import case_memory
from graphrag.store import graphrag_store
from agent.workflow import fraud_agent
from tools import ALL_TOOLS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("FraudGraph.App")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Agentic Fraud Investigation & Next-Best-Action Platform on TigerGraph (HHGOA Hackathon)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory active investigations cache
active_investigations: Dict[str, Any] = {}

# Ensure dataset is loaded on startup
@app.on_event("startup")
def on_startup():
    logger.info("Initializing FraudGraph Knowledge Graph & Case Memory...")
    load_dataset_into_graph()
    logger.info("Startup complete. Graph nodes and historical memory primed.")

# Pydantic request models
class InvestigateRequest(BaseModel):
    transaction_id: str
    trigger_reason: str = "High-Risk Transaction Alert"
    simulated_step_up_outcome: Optional[str] = None

class ApprovalRequest(BaseModel):
    decision: str  # "APPROVE" or "OVERRIDE"
    analyst_name: str = "Senior Fraud Analyst"
    override_action: Optional[str] = None
    notes: Optional[str] = "Reviewed graph linkages and validated sanction list."

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tigergraph_mode": "LIVE_SAVANNA" if tg_client.is_live else "HIGH_FIDELITY_EMULATOR",
        "total_vertices": sum(len(v) for v in graph_store.vertices.values()),
        "total_edges": len(graph_store.edges),
        "total_historical_cases": len(case_memory.cases),
        "policies_loaded": len(graphrag_store.policies)
    }

@app.get("/api/benchmarks")
def get_benchmarks():
    dataset_file = os.path.join(DATASET_DIR, "hhgoa_dataset.json")
    if not os.path.exists(dataset_file):
        generate_hhgoa_ieee_dataset()
    with open(dataset_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("benchmark_cases", [])

@app.get("/api/benchmark-results")
def get_benchmark_results():
    output_dir = os.path.join(BACKEND_DIR, "output")
    summary_path = os.path.join(output_dir, "all_benchmark_answers.json")
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/api/cases")
def list_cases():
    results = []
    for c_id, c in case_memory.cases.items():
        results.append(c)
    results.sort(key=lambda x: x.get("final_risk_score", 0.0), reverse=True)
    return results

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    # Check in active investigations first
    if case_id in active_investigations:
        return active_investigations[case_id]
    
    # Check in case memory
    c = case_memory.get_case(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    return c

@app.post("/api/investigate")
def run_investigation(req: InvestigateRequest):
    logger.info(f"Triggering investigation for Transaction {req.transaction_id} (Trigger: {req.trigger_reason})")
    state = fraud_agent.run_investigation(
        transaction_id=req.transaction_id,
        trigger_reason=req.trigger_reason,
        simulated_step_up_outcome=req.simulated_step_up_outcome
    )
    result_dict = state.dict()
    if state.case_id:
        active_investigations[state.case_id] = result_dict
    return result_dict

@app.post("/api/cases/{case_id}/approve")
def handle_human_approval(case_id: str, req: ApprovalRequest):
    case = active_investigations.get(case_id) or case_memory.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    final_action = req.override_action if req.decision == "OVERRIDE" and req.override_action else case.get("next_best_action", {}).get("action", "BLOCK_TRANSACTION")
    
    # Execute action
    executed = ALL_TOOLS["execute_simulated_action"](
        case_id=case_id,
        action_type=final_action,
        reason=f"Human Analyst ({req.analyst_name}) {req.decision} with note: {req.notes}",
        executed_by=req.analyst_name,
        approval_tier="HUMAN_APPROVED"
    )

    # Update case memory and state
    updates = {
        "approval_status": "APPROVED" if req.decision == "APPROVE" else "OVERRIDDEN",
        "final_action": final_action,
        "executed_action": executed,
        "status": "RESOLVED",
        "human_notes": req.notes,
        "analyst_name": req.analyst_name
    }
    
    ALL_TOOLS["update_case"](case_id, updates)
    if case_id in active_investigations:
        active_investigations[case_id].update(updates)
        active_investigations[case_id]["executed_action"] = executed

    return {
        "status": "SUCCESS",
        "decision": req.decision,
        "executed_action": executed,
        "updated_case": case_memory.get_case(case_id)
    }

@app.get("/api/graph/{transaction_id}")
def get_transaction_graph(transaction_id: str, depth: int = 2):
    subg = tg_client.get_subgraph("Transaction", transaction_id, depth=depth)
    return subg

@app.get("/api/policies")
def get_policies_and_typologies():
    return {
        "policies": list(graphrag_store.policies.values()),
        "typologies": list(graphrag_store.typologies.values())
    }

@app.get("/api/case-memory/similar")
def find_similar(pattern: str = "Device Farming", amount: float = 1000.0, risk_score: float = 0.8):
    sims = case_memory.find_similar_cases({
        "fraud_pattern": pattern,
        "amount": amount,
        "risk_score": risk_score
    }, top_k=4)
    return sims

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=False)
