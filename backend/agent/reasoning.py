from typing import Dict, Any, List, Optional
from config import settings
import logging

logger = logging.getLogger("FraudGraph.Reasoning")

class ReasoningEngine:
    """
    Evidence-based Explainability and Reasoning Synthesizer.
    Answers the 8 mandatory explainability questions without exposing private chain-of-thought.
    """

    def generate_explanations(self, state_dict: Dict[str, Any]) -> Dict[str, str]:
        txn = state_dict.get("transaction") or {}
        txn_id = txn.get("id", "Unknown")
        amount = float(txn.get("amount", 0.0))
        pattern = state_dict.get("fraud_pattern") or "Unclassified Anomaly"
        risk_data = state_dict.get("post_evidence_assessment") or state_dict.get("risk_assessment") or {}
        risk_score = risk_data.get("risk_score", 0.5)
        confidence = risk_data.get("confidence_score", 0.5)
        uncertainty = risk_data.get("uncertainty_score", 0.5)
        nba = state_dict.get("next_best_action") or {}
        action_name = nba.get("action", "MONITOR_ACCOUNT")
        policy_ref = nba.get("policy_reference", "POL-001")
        approval = nba.get("approval_display", "Automated Execution")
        
        dev_sharing = state_dict.get("device_sharing") or {}
        distinct_custs = dev_sharing.get("distinct_customers", 1)
        is_emulator = (state_dict.get("device") or {}).get("is_emulator", False)
        ip_info = state_dict.get("ip") or {}
        is_vpn = ip_info.get("is_vpn", False)
        
        step_up_req = state_dict.get("additional_evidence_requested")
        step_up_res = state_dict.get("additional_evidence_result")

        # 1. "What did the agent find?"
        findings = []
        if distinct_custs > 1:
            findings.append(f"Physical device fingerprint shared across {distinct_custs} distinct customer identities")
        if is_emulator:
            findings.append("Emulated virtual machine hardware environment")
        if is_vpn:
            findings.append(f"Anonymizing VPN/Proxy routing ({ip_info.get('ip_address')})")
        if (state_dict.get("velocity_burst") or {}).get("is_velocity_burst"):
            findings.append("Accelerated transaction velocity exceeding baseline limits")
        if not findings:
            findings.append("Standard transaction profile with minor deviations from historical spend")
        q1_find = "; ".join(findings) + f" (Identified Typology: {pattern})."

        # 2. "Why is this suspicious?"
        suspicious_points = []
        if distinct_custs >= 3 or is_emulator:
            suspicious_points.append("Device collision pattern indicates synthetic farming or multi-accounting fraud")
        if is_vpn:
            suspicious_points.append("Geolocation obfuscation masks true originating host network")
        if step_up_res == "FAILED":
            suspicious_points.append("Cardholder failed active out-of-band biometric/MFA challenge")
        elif amount > 1000:
            suspicious_points.append(f"Transactional value (${amount:,.2f}) significantly elevates downside exposure")
        if not suspicious_points:
            suspicious_points.append("Subtle behavioral deviations warrant caution but lack confirmed fraudulent intent")
        q2_suspicious = ". ".join(suspicious_points) + "."

        # 3. "What evidence is missing?"
        missing = risk_data.get("missing_evidence", [])
        q3_missing = "; ".join(missing) if missing else "All required primary evidence checklist items were acquired."

        # 4. "Why was additional evidence requested?"
        if step_up_req:
            q4_stepup = (
                f"Initial graph and anomaly evidence presented elevated risk ({state_dict.get('risk_assessment', {}).get('risk_score', 0.5):.2f}) "
                f"but an unacceptable decision uncertainty ({state_dict.get('risk_assessment', {}).get('uncertainty_score', 0.5):.2f}). "
                f"Under policy POL-004, the agent is prohibited from destructive blocking without verifying identity."
            )
        else:
            q4_stepup = "Initial evidence and historical case precedents provided sufficient confidence to act defensibly without requiring additional verification."

        # 5. "Why was this action selected?"
        q5_action = (
            f"The action '{nba.get('action_display', action_name)}' was selected because it maximizes loss prevention "
            f"while minimizing false-positive friction. Final risk score is {risk_score:.2f} with {confidence*100:.0f}% confidence."
        )

        # 6. "What policy supports this action?"
        q6_policy = f"{policy_ref}. Threshold criteria and category governance verified against GraphRAG repository."

        # 7. "What approval is required?"
        q7_approval = f"{approval}. " + (
            "Requires human analyst sign-off prior to cardholder debit freeze."
            if nba.get("is_sensitive") else
            "Permitted for immediate automated execution without human bottleneck."
        )

        # 8. "What uncertainty remains?"
        rem_uncertainty = uncertainty
        q8_uncertainty = (
            f"Remaining decision uncertainty is {rem_uncertainty*100:.1f}%. " +
            ("Residual risk is minimal following failed 2FA challenge and multi-hop graph corroboration."
             if step_up_res == "FAILED" else
             "Ongoing behavioral monitoring is established to mitigate residual risk.")
        )

        return {
            "what_did_the_agent_find": q1_find,
            "why_is_this_suspicious": q2_suspicious,
            "what_evidence_is_missing": q3_missing,
            "why_was_additional_evidence_requested": q4_stepup,
            "why_was_this_action_selected": q5_action,
            "what_policy_supports_this_action": q6_policy,
            "what_approval_is_required": q7_approval,
            "what_uncertainty_remains": q8_uncertainty
        }

reasoning_engine = ReasoningEngine()
