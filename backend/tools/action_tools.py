import time
import uuid
from typing import Dict, Any, Optional
from tigergraph.client import tg_client
from nba.engine import nba_engine
from config import settings

def check_action_permission(action: str, amount: float, uncertainty: float) -> Dict[str, Any]:
    """
    Validates whether the proposed action requires human escalation or is auto-executable under policy rules.
    """
    requires_approval = False
    approval_tier = "AUTOMATED_EXECUTION"
    policy_code = "POL-001"

    if action in ("BLOCK_TRANSACTION", "ESCALATE_TO_FRAUD_ANALYST"):
        if amount >= settings.HIGH_VALUE_THRESHOLD or uncertainty >= 0.35:
            requires_approval = True
            approval_tier = "TIER_1_FRAUD_ANALYST"
            policy_code = "POL-005"
        if amount >= 5000.0:
            requires_approval = True
            approval_tier = "TIER_2_SENIOR_ANALYST"
            policy_code = "POL-006"

    return {
        "action": action,
        "amount": amount,
        "requires_approval": requires_approval,
        "approval_tier": approval_tier,
        "governing_policy": policy_code,
        "permitted_to_auto_execute": not requires_approval
    }

def recommend_next_best_action(
    assessment: Dict[str, Any],
    transaction: Dict[str, Any],
    fraud_pattern: Optional[str] = None
) -> Dict[str, Any]:
    """
    Invokes the Next Best Action engine to generate an actionable, policy-compliant decision.
    """
    return nba_engine.determine_action(
        assessment=assessment,
        transaction=transaction,
        fraud_pattern=fraud_pattern
    )

def request_human_approval(
    case_id: str,
    action_type: str,
    reason: str,
    tier: str = "TIER_1_FRAUD_ANALYST"
) -> Dict[str, Any]:
    """
    Submits a pending approval task for human-in-the-loop fraud analyst decisioning.
    """
    approval_id = f"APPR-{int(time.time())}-{str(uuid.uuid4())[:4].upper()}"
    return {
        "approval_id": approval_id,
        "case_id": case_id,
        "action_type": action_type,
        "reason": reason,
        "tier": tier,
        "status": "AWAITING_REVIEW",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def execute_simulated_action(
    case_id: str,
    action_type: str,
    reason: str,
    executed_by: str = "FraudGraph_Agent",
    approval_tier: str = "AUTOMATED_EXECUTION"
) -> Dict[str, Any]:
    """
    Simulates execution of the final approved action and logs the Action vertex in TigerGraph.
    """
    act_id = f"ACT-{int(time.time())}-{str(uuid.uuid4())[:4].upper()}"
    act_record = {
        "id": act_id,
        "action_type": action_type,
        "reason": reason,
        "approval_tier": approval_tier,
        "executed_by": executed_by,
        "executed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "COMPLETED",
        "policy_reference": "POL-002" if "BLOCK" in action_type else "POL-001"
    }

    tg_client.upsert_vertex("Action", act_id, act_record)
    tg_client.upsert_edge("resulted_in", "FraudCase", case_id, "Action", act_id)
    return act_record
