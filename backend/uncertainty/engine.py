from typing import List, Dict, Any, Optional

class UncertaintyEngine:
    """
    Explicit Mathematical Evidence & Uncertainty Engine for FraudGraph Agent.
    Implements a 4-factor confidence model:
    - Graph Support (35%)
    - Historical Similar Cases Support (25%)
    - Anomaly Signal Strength (25%)
    - Evidence Coverage Checklist (15%)
    """

    def calculate_assessment(
        self,
        graph_risk: float,
        evidence_list: List[Dict[str, Any]],
        similar_cases: List[Dict[str, Any]],
        anomaly_score: float,
        step_up_result: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates multi-dimensional risk, confidence, uncertainty, and defensibility.
        """
        # Categorize evidence
        supporting = []
        contradicting = []
        
        for ev in evidence_list:
            polarity = ev.get("polarity", "SUPPORTING").upper()
            if polarity == "SUPPORTING":
                supporting.append(ev)
            else:
                contradicting.append(ev)

        # 1. Graph Support (35%)
        # High graph risk with confirmed multi-hop linkages strengthens graph confidence
        graph_factor = min(1.0, max(0.0, graph_risk))

        # 2. Historical Case Support (25%)
        # Check historical cases with high similarity
        if similar_cases:
            confirmed_frauds = sum(1 for c in similar_cases if c.get("outcome") in ("CONFIRMED_FRAUD", "BLOCKED"))
            historical_factor = confirmed_frauds / len(similar_cases)
        else:
            historical_factor = 0.50  # Neutral prior if no history exists

        # 3. Anomaly Signal Strength (25%)
        signal_factor = min(1.0, max(0.0, anomaly_score))

        # 4. Evidence Coverage (15%)
        # Expected checklist: [device_analyzed, ip_analyzed, customer_history_checked, policy_retrieved]
        checked_sources = set(ev.get("source_tool", "") for ev in evidence_list)
        expected_sources = {"trace_device_connections", "trace_ip_connections", "search_customer_history", "retrieve_fraud_policy"}
        coverage_ratio = len(checked_sources.intersection(expected_sources)) / len(expected_sources)

        # Base Confidence Calculation
        base_confidence = (
            0.35 * (graph_factor if graph_factor > 0.5 else (1.0 - graph_factor)) +
            0.25 * (historical_factor if historical_factor > 0.5 else (1.0 - historical_factor)) +
            0.25 * (signal_factor if signal_factor > 0.5 else (1.0 - signal_factor)) +
            0.15 * coverage_ratio
        )

        # Adjust for Step-up Authentication if present
        missing_evidence = []
        if "trace_device_connections" not in checked_sources:
            missing_evidence.append("Device hardware fingerprint linkage verification")
        if "trace_ip_connections" not in checked_sources:
            missing_evidence.append("Geographic IP geolocation & proxy traversal")
        if "search_customer_history" not in checked_sources:
            missing_evidence.append("30-day customer transactional baseline comparison")

        if step_up_result is None:
            missing_evidence.append("Out-of-band Step-Up MFA / Biometric verification")
        elif step_up_result == "FAILED":
            # Failed challenge is definitive supporting fraud evidence
            supporting.append({
                "evidence_type": "STEP_UP_CHALLENGE",
                "description": "Customer failed out-of-band biometric/SMS challenge (Authentication Rejected)",
                "confidence_weight": 0.95,
                "polarity": "SUPPORTING",
                "source_tool": "request_step_up_authentication"
            })
            base_confidence = min(0.98, base_confidence + 0.25)
        elif step_up_result == "PASSED":
            # Passed challenge is strong contradicting evidence of fraud
            contradicting.append({
                "evidence_type": "STEP_UP_CHALLENGE",
                "description": "Legitimate cardholder completed biometric 2FA successfully",
                "confidence_weight": 0.95,
                "polarity": "CONTRADICTING",
                "source_tool": "request_step_up_authentication"
            })
            base_confidence = min(0.96, base_confidence + 0.20)

        # Synthesize Overall Risk Score
        weighted_risk = (0.45 * graph_risk) + (0.35 * anomaly_score) + (0.20 * historical_factor)
        if step_up_result == "FAILED":
            weighted_risk = min(1.0, weighted_risk + 0.25)
        elif step_up_result == "PASSED":
            weighted_risk = max(0.05, weighted_risk - 0.45)

        confidence_score = round(min(0.99, max(0.20, base_confidence)), 2)
        uncertainty_score = round(1.0 - confidence_score, 2)
        risk_score = round(min(1.0, max(0.0, weighted_risk)), 2)

        # Determine Risk Level
        if risk_score >= 0.75:
            risk_level = "CRITICAL"
        elif risk_score >= 0.50:
            risk_level = "HIGH"
        elif risk_score >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Determine Defensibility & Additional Evidence Requirement
        # If risk is elevated (> 0.45) but confidence is below 0.70 and step-up hasn't occurred, step-up is required
        additional_evidence_required = False
        if risk_score >= 0.45 and confidence_score < 0.75 and step_up_result is None:
            additional_evidence_required = True

        investigation_status = "ACTIONABLE" if (confidence_score >= 0.75 or step_up_result is not None) else "NEEDS_EVIDENCE"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "uncertainty_score": uncertainty_score,
            "breakdown": {
                "graph_support_pct": round(graph_factor * 100, 1),
                "historical_support_pct": round(historical_factor * 100, 1),
                "signal_strength_pct": round(signal_factor * 100, 1),
                "evidence_coverage_pct": round(coverage_ratio * 100, 1)
            },
            "evidence_count": len(supporting) + len(contradicting),
            "supporting_evidence": supporting,
            "contradicting_evidence": contradicting,
            "missing_evidence": missing_evidence,
            "investigation_status": investigation_status,
            "additional_evidence_required": additional_evidence_required,
            "is_defensible": confidence_score >= 0.70
        }

# Singleton uncertainty engine
uncertainty_engine = UncertaintyEngine()
