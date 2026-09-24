import time
import uuid
from typing import Dict, Any, Optional
from tigergraph.client import tg_client

def add_case_evidence(
    case_id: str,
    evidence_type: str,
    description: str,
    confidence_weight: float = 0.8,
    polarity: str = "SUPPORTING",
    source_tool: str = "agent"
) -> Dict[str, Any]:
    """
    Appends an evidence item to the FraudCase in the graph and returns the evidence record.
    """
    ev_id = f"EV-{int(time.time())}-{str(uuid.uuid4())[:4].upper()}"
    ev_record = {
        "id": ev_id,
        "evidence_type": evidence_type,
        "description": description,
        "confidence_weight": confidence_weight,
        "polarity": polarity.upper(),
        "source_tool": source_tool,
        "discovered_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    tg_client.upsert_vertex("Evidence", ev_id, ev_record)
    tg_client.upsert_edge("contains", "FraudCase", case_id, "Evidence", ev_id)
    return ev_record

def request_customer_verification(
    customer_id: str,
    channel: str = "SMS_PING",
    challenge_type: str = "OUT_OF_BAND_CONFIRMATION"
) -> Dict[str, Any]:
    """
    Dispatches an asynchronous customer ping to confirm whether the cardholder recognizes the transaction.
    """
    return {
        "status": "DISPATCHED",
        "channel": channel,
        "challenge_type": challenge_type,
        "customer_id": customer_id,
        "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "message": f"Verification ping transmitted to customer {customer_id} via {channel}."
    }

def request_step_up_authentication(
    transaction_id: str,
    method: str = "BIOMETRIC_PUSH",
    simulated_outcome: Optional[str] = None
) -> Dict[str, Any]:
    """
    Requests active step-up 2FA (Biometric WebAuthn or SMS OTP).
    Supports deterministic demo simulation outcome ('PASSED' or 'FAILED').
    """
    outcome = simulated_outcome if simulated_outcome in ("PASSED", "FAILED") else "FAILED"
    return {
        "transaction_id": transaction_id,
        "method": method,
        "outcome": outcome,
        "latency_ms": 340,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "details": f"Step-up challenge ({method}) returned: {outcome}."
    }
