import time
from typing import Dict, Any, Optional
from agent.state import InvestigationState
from agent.reasoning import reasoning_engine
from tools import ALL_TOOLS
from uncertainty.engine import uncertainty_engine
from nba.engine import nba_engine
import logging

logger = logging.getLogger("FraudGraph.AgentWorkflow")

class FraudInvestigationAgent:
    """
    Autonomous, Uncertainty-Gated Fraud Investigation Agent.
    Executes a cyclic state machine backed by TigerGraph GSQL graph analytics,
    GraphRAG policy retrieval, explicit uncertainty computation, and case memory.
    """

    def run_investigation(
        self,
        transaction_id: str,
        trigger_reason: str = "High-Risk Anomaly Alert",
        simulated_step_up_outcome: Optional[str] = None
    ) -> InvestigationState:
        start_time = time.time()
        timeline = []

        def log_step(step_name: str, description: str, data: Any = None):
            timeline.append({
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "step": step_name,
                "description": description,
                "data": data
            })

        log_step("TRIGGER", f"Received investigation trigger: '{trigger_reason}' for Transaction {transaction_id}")

        # STEP 1: CREATE CASE
        case_rec = ALL_TOOLS["create_case"](transaction_id=transaction_id, trigger_reason=trigger_reason)
        case_id = case_rec["id"]
        log_step("CREATE_CASE", f"Opened new fraud investigation case: {case_id}", case_rec)

        # STEP 2 & 3: INVESTIGATE & GATHER GRAPH EVIDENCE
        txn_details = ALL_TOOLS["get_transaction_details"](transaction_id=transaction_id)
        log_step("INVESTIGATE", f"Retrieved transactional context: Amount=${txn_details.get('amount', 0):,.2f}", txn_details)

        device_info = txn_details.get("device")
        ip_info = txn_details.get("ip")
        account_info = txn_details.get("account")
        merchant_info = txn_details.get("merchant")

        device_sharing = None
        if device_info:
            device_sharing = ALL_TOOLS["trace_device_connections"](device_id=device_info["id"])
            log_step("GATHER_GRAPH_EVIDENCE", f"Executed GSQL query trace_device_sharing on Device {device_info['id']}: {device_sharing.get('distinct_customers', 0)} linked customers.", device_sharing)
            if device_sharing.get("distinct_customers", 0) > 1:
                ALL_TOOLS["add_case_evidence"](
                    case_id=case_id,
                    evidence_type="DEVICE_MULTI_ACCOUNTING",
                    description=f"Device {device_info['id']} shared across {device_sharing.get('distinct_customers')} distinct customer accounts",
                    confidence_weight=0.90,
                    polarity="SUPPORTING",
                    source_tool="trace_device_connections"
                )

        ip_cluster = None
        if ip_info:
            ip_cluster = ALL_TOOLS["trace_ip_connections"](ip_id=ip_info["id"])
            log_step("GATHER_GRAPH_EVIDENCE", f"Executed GSQL query trace_ip_cluster on IP {ip_info['id']}: {ip_cluster.get('customer_count', 0)} connected accounts.", ip_cluster)
            if ip_info.get("is_vpn") or ip_info.get("is_tor"):
                ALL_TOOLS["add_case_evidence"](
                    case_id=case_id,
                    evidence_type="ANONYMIZED_IP",
                    description=f"Transaction routed via VPN/Tor node ({ip_info.get('ip_address')})",
                    confidence_weight=0.85,
                    polarity="SUPPORTING",
                    source_tool="trace_ip_connections"
                )

        mule_chain = None
        velocity_burst = None
        customer_id = None
        if account_info:
            mule_chain = ALL_TOOLS["trace_account_relationships"](account_id=account_info["id"], max_hops=3)
            # Find customer
            custs = ALL_TOOLS["trace_transaction_network"](transaction_id=transaction_id, depth=2)
            for node in custs.get("nodes", []):
                if node.get("type") == "Customer":
                    customer_id = node.get("attributes", {}).get("id")
                    break

        # Extract Subgraph for Analyst Visualizer
        subgraph = ALL_TOOLS["trace_transaction_network"](transaction_id=transaction_id, depth=2)

        # STEP 4: RETRIEVE TRANSACTION HISTORY
        cust_history = None
        if customer_id:
            cust_history = ALL_TOOLS["search_customer_history"](customer_id=customer_id)
            log_step("RETRIEVE_TRANSACTION_HISTORY", f"Checked historical baseline for Customer {customer_id}: Avg spend ${cust_history.get('average_transaction_amount', 0):,.2f}", cust_history)
            if cust_history.get("average_transaction_amount", 0) > 0:
                amount = float(txn_details.get("amount", 0.0))
                avg_amt = cust_history["average_transaction_amount"]
                if amount > (avg_amt * 3.0):
                    ALL_TOOLS["add_case_evidence"](
                        case_id=case_id,
                        evidence_type="VOLUME_DEVIATION",
                        description=f"Transaction amount (${amount:,.2f}) is {amount/avg_amt:.1f}x higher than 30-day baseline average (${avg_amt:,.2f})",
                        confidence_weight=0.75,
                        polarity="SUPPORTING",
                        source_tool="search_customer_history"
                    )

        # STEP 5: IDENTIFY FRAUD PATTERN
        pattern_res = ALL_TOOLS["detect_fraud_patterns"](transaction_id=transaction_id)
        fraud_pattern = pattern_res.get("primary_pattern") or "Unclassified Anomaly"
        log_step("IDENTIFY_FRAUD_PATTERN", f"Graph pattern detection identified: '{fraud_pattern}' ({pattern_res.get('pattern_count', 0)} patterns detected).", pattern_res)

        # STEP 6: RETRIEVE POLICY / GRAPHRAG CONTEXT
        policies = ALL_TOOLS["retrieve_fraud_policy"](query=fraud_pattern)
        typology = ALL_TOOLS["retrieve_fraud_typology"](pattern_query=fraud_pattern)
        log_step("RETRIEVE_POLICY_GRAPHRAG", f"GraphRAG retrieved {len(policies)} governing policies and typology '{typology.get('name') if typology else fraud_pattern}'", policies)

        # STEP 7: RETRIEVE SIMILAR CASES
        graph_risk_info = ALL_TOOLS["calculate_graph_risk"](transaction_id=transaction_id)
        graph_risk_score = graph_risk_info.get("graph_risk_score", 0.5)

        similar_cases = ALL_TOOLS["find_similar_fraud_cases"]({
            "case_id": case_id,
            "fraud_pattern": fraud_pattern,
            "amount": txn_details.get("amount", 0.0),
            "is_emulator": (device_info or {}).get("is_emulator", False),
            "is_vpn": (ip_info or {}).get("is_vpn", False),
            "risk_score": graph_risk_score
        }, top_k=3)
        log_step("RETRIEVE_SIMILAR_CASES", f"Retrieved {len(similar_cases)} structurally similar historical cases from case memory.", similar_cases)

        # STEP 8, 9, 10: ASSESS RISK, CONFIDENCE, AND CHECK UNCERTAINTY
        ev_list = []
        # Gather all current evidences
        if device_sharing and device_sharing.get("distinct_customers", 0) > 1:
            ev_list.append({"description": f"Device shared across {device_sharing.get('distinct_customers')} customers", "polarity": "SUPPORTING", "source_tool": "trace_device_connections"})
        if ip_info and (ip_info.get("is_vpn") or ip_info.get("is_tor")):
            ev_list.append({"description": f"Anonymized network connection ({ip_info.get('ip_address')})", "polarity": "SUPPORTING", "source_tool": "trace_ip_connections"})
        if cust_history:
            ev_list.append({"description": "Customer transactional baseline verified", "polarity": "SUPPORTING", "source_tool": "search_customer_history"})
        if policies:
            ev_list.append({"description": f"Enforces policy {policies[0]['policy_code']}", "polarity": "SUPPORTING", "source_tool": "retrieve_fraud_policy"})

        initial_assessment = uncertainty_engine.calculate_assessment(
            graph_risk=graph_risk_score,
            evidence_list=ev_list,
            similar_cases=similar_cases,
            anomaly_score=float(txn_details.get("anomaly_score", 0.4)),
            step_up_result=None
        )

        initial_nba = nba_engine.determine_action(
            assessment=initial_assessment,
            transaction=txn_details,
            fraud_pattern=fraud_pattern
        )

        log_step("ASSESS_UNCERTAINTY", (
            f"Risk Level: {initial_assessment['risk_level']} (Score: {initial_assessment['risk_score']:.2f}) | "
            f"Confidence: {initial_assessment['confidence_score']:.2f} | Uncertainty: {initial_assessment['uncertainty_score']:.2f} | "
            f"Additional Evidence Required: {initial_assessment['additional_evidence_required']}"
        ), initial_assessment)

        # STEP 11: IF EVIDENCE INSUFFICIENT -> REQUEST ADDITIONAL EVIDENCE
        additional_evidence_requested = None
        additional_evidence_result = None
        post_assessment = initial_assessment

        if initial_assessment["additional_evidence_required"]:
            additional_evidence_requested = "REQUEST_STEP_UP_AUTHENTICATION"
            log_step("REQUEST_ADDITIONAL_EVIDENCE", "Uncertainty exceeds defensible threshold. Dispatching biometric/SMS Step-Up Authentication challenge.")
            
            # Simulated outcome
            step_up_res = ALL_TOOLS["request_step_up_authentication"](
                transaction_id=transaction_id,
                simulated_outcome=simulated_step_up_outcome or "FAILED"
            )
            additional_evidence_result = step_up_res.get("outcome")
            log_step("RECEIVE_RESULT", f"Step-up authentication result received: {additional_evidence_result}", step_up_res)

            # Recalculate risk & uncertainty with verified challenge
            post_assessment = uncertainty_engine.calculate_assessment(
                graph_risk=graph_risk_score,
                evidence_list=ev_list,
                similar_cases=similar_cases,
                anomaly_score=float(txn_details.get("anomaly_score", 0.4)),
                step_up_result=additional_evidence_result
            )
            log_step("REASSESS_RISK", (
                f"Recalculated Risk: {post_assessment['risk_score']:.2f} | "
                f"Updated Confidence: {post_assessment['confidence_score']:.2f} | "
                f"Updated Uncertainty: {post_assessment['uncertainty_score']:.2f}"
            ), post_assessment)

        # STEP 12: DETERMINE NEXT BEST ACTION
        final_nba = nba_engine.determine_action(
            assessment=post_assessment,
            transaction=txn_details,
            fraud_pattern=fraud_pattern
        )
        log_step("DETERMINE_NEXT_BEST_ACTION", f"Recommended Next Best Action: {final_nba['action']} ({final_nba['action_display']})", final_nba)

        # STEP 13: CHECK POLICY AND PERMISSION
        perm_check = ALL_TOOLS["check_action_permission"](
            action=final_nba["action"],
            amount=float(txn_details.get("amount", 0.0)),
            uncertainty=post_assessment["uncertainty_score"]
        )
        log_step("CHECK_POLICY_PERMISSION", f"Policy check completed. Requires approval: {perm_check['requires_approval']} (Tier: {perm_check['approval_tier']})", perm_check)

        # STEP 14: REQUEST APPROVAL OR EXECUTE
        approval_status = "AUTOMATED"
        executed_act = None
        if perm_check["requires_approval"]:
            approval_status = "PENDING_APPROVAL"
            appr = ALL_TOOLS["request_human_approval"](
                case_id=case_id,
                action_type=final_nba["action"],
                reason=final_nba["reason"],
                tier=perm_check["approval_tier"]
            )
            log_step("REQUEST_HUMAN_APPROVAL", f"Queued for human sign-off ({perm_check['approval_tier']})", appr)
        else:
            executed_act = ALL_TOOLS["execute_simulated_action"](
                case_id=case_id,
                action_type=final_nba["action"],
                reason=final_nba["reason"],
                executed_by="FraudGraph_Autonomous_Agent",
                approval_tier="AUTOMATED_EXECUTION"
            )
            log_step("EXECUTE_ACTION", f"Executed action: {final_nba['action']}", executed_act)

        # STEP 15: EXPLAIN DECISION (8-Question Explainability Matrix)
        raw_state_for_expl = {
            "transaction": txn_details,
            "device": device_info,
            "ip": ip_info,
            "device_sharing": device_sharing,
            "velocity_burst": velocity_burst,
            "fraud_pattern": fraud_pattern,
            "risk_assessment": initial_assessment,
            "post_evidence_assessment": post_assessment,
            "additional_evidence_requested": additional_evidence_requested,
            "additional_evidence_result": additional_evidence_result,
            "next_best_action": final_nba
        }
        explanations = reasoning_engine.generate_explanations(raw_state_for_expl)
        log_step("EXPLAIN_DECISION", "Generated 8-question structured explainability rationale.", explanations)

        # STEP 16: UPDATE CASE MEMORY
        final_outcome = "BLOCKED" if "BLOCK" in final_nba["action"] else ("MONITORED" if "MONITOR" in final_nba["action"] else "ALLOWED")
        case_summary_record = {
            "id": case_id,
            "case_id": case_id,
            "transaction_id": transaction_id,
            "trigger_reason": trigger_reason,
            "amount": float(txn_details.get("amount", 0.0)),
            "fraud_pattern": fraud_pattern,
            "final_risk_score": post_assessment["risk_score"],
            "confidence_score": post_assessment["confidence_score"],
            "uncertainty_score": post_assessment["uncertainty_score"],
            "action": final_nba["action"],
            "actions": [final_nba["action"]],
            "outcome": final_outcome,
            "final_resolution": final_outcome,
            "entities": {
                "device_id": (device_info or {}).get("id"),
                "is_emulator": (device_info or {}).get("is_emulator", False),
                "ip_address": (ip_info or {}).get("ip_address"),
                "is_vpn": (ip_info or {}).get("is_vpn", False)
            }
        }
        ALL_TOOLS["update_case_memory"](case_summary_record)
        log_step("UPDATE_CASE_MEMORY", f"Persisted case outcome ({final_outcome}) into TigerGraph case memory.", case_summary_record)

        end_time = time.time()
        total_ms = int((end_time - start_time) * 1000)
        log_step("CLOSE_OR_ESCALATE", f"Case investigation concluded in {total_ms}ms with outcome: {final_outcome}.")

        # Return full pydantic InvestigationState
        return InvestigationState(
            case_id=case_id,
            transaction_id=transaction_id,
            trigger_reason=trigger_reason,
            status="RESOLVED" if approval_status == "AUTOMATED" else "AWAITING_APPROVAL",
            current_step_index=len(timeline),
            customer=ALL_TOOLS["search_customer_history"](customer_id) if customer_id else None,
            account=account_info,
            transaction=txn_details,
            device=device_info,
            ip=ip_info,
            merchant=merchant_info,
            device_sharing=device_sharing,
            ip_cluster=ip_cluster,
            mule_chain=mule_chain,
            velocity_burst=velocity_burst,
            fraud_pattern=fraud_pattern,
            graph_risk_metrics=graph_risk_info,
            subgraph=subgraph,
            evidence=post_assessment.get("supporting_evidence", []),
            customer_history=cust_history,
            similar_cases=similar_cases,
            applicable_policies=policies,
            risk_assessment=initial_assessment,
            initial_nba=initial_nba,
            additional_evidence_requested=additional_evidence_requested,
            additional_evidence_result=additional_evidence_result,
            post_evidence_assessment=post_assessment,
            next_best_action=final_nba,
            permission_check=perm_check,
            approval_status=approval_status,
            executed_action=executed_act,
            explanations=explanations,
            timeline=timeline,
            started_at=timeline[0]["timestamp"] if timeline else None,
            completed_at=timeline[-1]["timestamp"] if timeline else None,
            total_execution_ms=total_ms
        )

fraud_agent = FraudInvestigationAgent()
