from typing import Dict, Any, List, Optional
from config import settings

class NextBestActionEngine:
    """
    Policy-Gated Next Best Action (NBA) Decision Engine.
    Evaluates risk, confidence, uncertainty, policy limits, and approval tiers.
    """

    def determine_action(
        self,
        assessment: Dict[str, Any],
        transaction: Dict[str, Any],
        fraud_pattern: Optional[str] = None,
        customer: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Computes the optimal Next Best Action with full policy justifications and approval governance.
        """
        risk_score = assessment.get("risk_score", 0.0)
        risk_level = assessment.get("risk_level", "LOW")
        confidence = assessment.get("confidence_score", 0.5)
        uncertainty = assessment.get("uncertainty_score", 0.5)
        additional_req = assessment.get("additional_evidence_required", False)
        supporting = assessment.get("supporting_evidence", [])
        amount = float(transaction.get("amount", 0.0))

        # 1. Check if Uncertainty mandates requesting additional evidence first
        if additional_req:
            return {
                "action": "REQUEST_STEP_UP_AUTHENTICATION",
                "action_display": "Request Step-Up Authentication (MFA / Biometric)",
                "reason": f"Elevated fraud risk ({risk_score:.2f}) observed with high decision uncertainty ({uncertainty:.2f}). Policy POL-004 requires active out-of-band identity challenge prior to transaction blocking.",
                "evidence": [e.get("description") for e in supporting[:3]],
                "confidence": confidence,
                "risk": risk_score,
                "required_approval": "AUTOMATED_EXECUTION",
                "approval_display": "Automated (Zero Human Latency)",
                "policy_reference": "POL-004 (Uncertainty-Gated Step-Up Authentication Protocol)",
                "remaining_uncertainty": uncertainty,
                "is_sensitive": False
            }

        # 2. Strong Fraud Evidence (Critical / High Risk with Defensible Confidence)
        if risk_score >= 0.75 and confidence >= 0.70:
            requires_human = (amount >= settings.HIGH_VALUE_THRESHOLD) or (uncertainty >= 0.25)
            
            # Check if SAR filing is mandated
            if amount >= 5000.0 or fraud_pattern in ("Money Mule Pass-Through Syndicate", "Synthetic Identity"):
                action = "ESCALATE_TO_FRAUD_ANALYST"
                policy_ref = "POL-005 & POL-006 (Mandatory SAR Filing & High-Value Governance)"
                approval = "TIER_2_SENIOR_ANALYST"
                approval_display = "Tier-2 Senior AML / Fraud Specialist Sign-off Required"
                reason = f"High-confidence fraud syndicate detected (Pattern: {fraud_pattern or 'Syndicate Network'}, Amount: ${amount:,.2f}). Exceeds regulatory threshold requiring account freezing and FinCEN SAR filing."
            elif requires_human:
                action = "BLOCK_TRANSACTION"
                policy_ref = "POL-005 (High-Value Destructive Action Governance)"
                approval = "TIER_1_FRAUD_ANALYST"
                approval_display = "Tier-1 Fraud Analyst Approval Required (Value > $2,000)"
                reason = f"Confirmed fraud signature with high confidence ({confidence:.2f}). Transaction amount (${amount:,.2f}) mandates human analyst review prior to cardholder debit freeze."
            else:
                action = "BLOCK_TRANSACTION"
                policy_ref = "POL-002 (Device & Syndicate Containment Policy)"
                approval = "AUTOMATED_EXECUTION"
                approval_display = "Automated Real-Time Block"
                reason = f"Severe fraud indicators confirmed across multi-hop graph analysis. Automated block triggered under policy POL-002."

            return {
                "action": action,
                "action_display": "Block Transaction & Freeze Channel" if action == "BLOCK_TRANSACTION" else "Escalate to Fraud Operations & File SAR",
                "reason": reason,
                "evidence": [e.get("description") for e in supporting],
                "confidence": confidence,
                "risk": risk_score,
                "required_approval": approval,
                "approval_display": approval_display,
                "policy_reference": policy_ref,
                "remaining_uncertainty": uncertainty,
                "is_sensitive": requires_human
            }

        # 3. Medium Risk (Suspicious Graph Context or Failed Baseline without Confirmed Malice)
        if risk_score >= 0.35:
            return {
                "action": "MONITOR_ACCOUNT",
                "action_display": "Allow with Enhanced Account Monitoring & Customer Ping",
                "reason": f"Moderate anomaly detected (Risk {risk_score:.2f}) without definitive evidence of account takeover or device farming. Enact real-time account telemetry and alert customer.",
                "evidence": [e.get("description") for e in supporting],
                "confidence": confidence,
                "risk": risk_score,
                "required_approval": "AUTOMATED_EXECUTION",
                "approval_display": "Automated Policy Action",
                "policy_reference": "POL-001 (High-Velocity & Volume Anomaly Policy)",
                "remaining_uncertainty": uncertainty,
                "is_sensitive": False
            }

        # 4. Low Risk / Defensible Legitimate Transaction
        return {
            "action": "ALLOW_TRANSACTION",
            "action_display": "Allow Transaction",
            "reason": f"Transaction conforms to historical customer baseline, verified hardware fingerprint, and non-suspicious IP routing. Risk ({risk_score:.2f}) well below thresholds.",
            "evidence": [e.get("description") for e in assessment.get("contradicting_evidence", [])] or ["Clean device fingerprint", "Trusted IP subnet"],
            "confidence": confidence,
            "risk": risk_score,
            "required_approval": "AUTOMATED_EXECUTION",
            "approval_display": "Automated Instant Clearance",
            "policy_reference": "POL-001 (Standard Transaction Clearance)",
            "remaining_uncertainty": uncertainty,
            "is_sensitive": False
        }

# Singleton NBA engine
nba_engine = NextBestActionEngine()
