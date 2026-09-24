import time
import uuid
from typing import Dict, Any, List, Optional
from tigergraph.client import tg_client
from memory.case_memory import case_memory
from graphrag.store import graphrag_store

def create_case(transaction_id: str, trigger_reason: str) -> Dict[str, Any]:
    """
    Initializes a new FraudCase node in the graph and case memory.
    """
    case_num = f"CASE-{int(time.time())}-{str(uuid.uuid4())[:4].upper()}"
    case_record = {
        "id": case_num,
        "case_number": case_num,
        "status": "OPEN",
        "trigger_reason": trigger_reason,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "closed_at": None,
        "final_risk_score": 0.0,
        "confidence_score": 0.0,
        "outcome": "PENDING"
    }

    tg_client.upsert_vertex("FraudCase", case_num, case_record)
    tg_client.upsert_edge("investigated_by", "Transaction", transaction_id, "FraudCase", case_num)
    case_memory.save_case(case_record)
    return case_record

def update_case(case_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates the status, risk score, confidence score, or resolution of an active case.
    """
    existing = case_memory.get_case(case_id) or {}
    existing.update(updates)
    case_memory.save_case(existing)
    tg_client.upsert_vertex("FraudCase", case_id, existing)
    return existing

def find_similar_fraud_cases(case_features: Dict[str, Any], top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Retrieves historically closed fraud cases with high structural and contextual similarity.
    """
    return case_memory.find_similar_cases(case_features, top_k=top_k)

def retrieve_fraud_policy(query: str) -> List[Dict[str, Any]]:
    """
    Queries GraphRAG policy store for regulatory rules and governance thresholds.
    """
    return graphrag_store.retrieve_policy(query)

def retrieve_fraud_typology(pattern_query: str) -> Optional[Dict[str, Any]]:
    """
    Queries GraphRAG store for fraud typology definition and recommended graph investigation procedures.
    """
    return graphrag_store.retrieve_typology(pattern_query)

def update_case_memory(case_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persists final case outcome, learned patterns, and graph associations into historical case memory.
    """
    case_id = case_record.get("id") or case_record.get("case_id")
    case_record["closed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    case_record["status"] = "CLOSED"
    case_memory.save_case(case_record)
    tg_client.upsert_vertex("FraudCase", case_id, case_record)

    # Link similar historical cases in the graph
    sim_cases = case_memory.find_similar_cases(case_record, top_k=2)
    for sc in sim_cases:
        sc_id = sc.get("id") or sc.get("case_id")
        if sc_id:
            tg_client.upsert_edge(
                "similar_to", 
                "FraudCase", 
                case_id, 
                "FraudCase", 
                sc_id, 
                {"similarity_score": sc.get("similarity_score", 0.8)}
            )

    return case_record
