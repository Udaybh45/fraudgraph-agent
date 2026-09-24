import math
from typing import List, Dict, Any, Optional

class CaseMemoryStore:
    """
    Case Memory & Graph-Linked Similarity Retrieval for Fraud Investigations.
    Stores complete historical case lifecycle and retrieves structurally similar past cases.
    """
    def __init__(self):
        self.cases: Dict[str, Dict[str, Any]] = {}

    def save_case(self, case_record: Dict[str, Any]) -> Dict[str, Any]:
        case_id = case_record.get("case_id") or case_record.get("id")
        if not case_id:
            raise ValueError("Case record must contain case_id")
        
        self.cases[case_id] = case_record
        return case_record

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        return self.cases.get(case_id)

    def find_similar_cases(
        self,
        current_features: Dict[str, Any],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-K structurally and contextually similar historical fraud cases.
        Calculates similarity using:
        - Pattern match (0.40)
        - Amount log-ratio proximity (0.25)
        - Shared entity flags (device emulator, VPN, proxy) (0.20)
        - Risk level alignment (0.15)
        """
        if not self.cases:
            return []

        curr_pattern = (current_features.get("fraud_pattern") or "").lower()
        curr_amount = float(current_features.get("amount") or 100.0)
        curr_emulator = bool(current_features.get("is_emulator", False))
        curr_vpn = bool(current_features.get("is_vpn", False))
        curr_risk = float(current_features.get("risk_score") or 0.5)

        scored_cases = []
        for c_id, c in self.cases.items():
            # Skip itself if present
            if c_id == current_features.get("case_id"):
                continue

            sim_score = 0.0

            # 1. Fraud pattern similarity
            hist_pattern = (c.get("fraud_pattern") or "").lower()
            if curr_pattern and hist_pattern and (curr_pattern in hist_pattern or hist_pattern in curr_pattern):
                sim_score += 0.40
            elif not curr_pattern and not hist_pattern:
                sim_score += 0.20

            # 2. Amount proximity (log ratio)
            hist_amount = float(c.get("amount") or 100.0)
            if hist_amount > 0 and curr_amount > 0:
                log_diff = abs(math.log10(curr_amount) - math.log10(hist_amount))
                amount_sim = max(0.0, 1.0 - (log_diff / 3.0))
                sim_score += 0.25 * amount_sim

            # 3. Shared technical attributes
            entities = c.get("entities", {})
            hist_emulator = bool(entities.get("is_emulator", False))
            hist_vpn = bool(entities.get("is_vpn", False))
            
            tech_match = 0
            if curr_emulator == hist_emulator:
                tech_match += 0.5
            if curr_vpn == hist_vpn:
                tech_match += 0.5
            sim_score += 0.20 * tech_match

            # 4. Risk alignment
            hist_risk = float(c.get("final_risk_score") or c.get("risk_score") or 0.5)
            risk_diff = abs(curr_risk - hist_risk)
            sim_score += 0.15 * max(0.0, 1.0 - risk_diff)

            rounded_sim = round(sim_score, 2)
            c_copy = dict(c)
            c_copy["similarity_score"] = rounded_sim
            c_copy["similarity_pct"] = int(rounded_sim * 100)
            c_copy["relevance_explanation"] = self._explain_relevance(c_copy, current_features)
            scored_cases.append(c_copy)

        scored_cases.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_cases[:top_k]

    def _explain_relevance(self, hist_case: Dict[str, Any], curr_features: Dict[str, Any]) -> str:
        points = []
        if hist_case.get("fraud_pattern") == curr_features.get("fraud_pattern"):
            points.append(f"Identical typology ({hist_case.get('fraud_pattern')})")
        outcome = hist_case.get("outcome") or hist_case.get("final_resolution", "RESOLVED")
        points.append(f"Historical outcome was {outcome} with action '{hist_case.get('action') or hist_case.get('actions')}'")
        return " | ".join(points)

# Singleton case memory store
case_memory = CaseMemoryStore()
