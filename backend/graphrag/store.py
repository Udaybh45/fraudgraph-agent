from typing import List, Dict, Any, Optional

class GraphRAGStore:
    """
    GraphRAG Knowledge Store for Fraud Policies, Fraud Typologies, and Regulatory Requirements.
    Contains interconnected nodes and semantic retrieval for the investigation agent.
    """
    def __init__(self):
        self.policies = {
            "POL-001": {
                "policy_code": "POL-001",
                "title": "High-Velocity & Off-Hour Volume Spike Policy",
                "category": "Velocity Controls",
                "summary": "Mandates automated transaction throttling or step-up authentication when an account exhibits >=3 transactions within 60 minutes or a 300% deviation from 30-day baseline spend.",
                "threshold_rules": "txn_count >= 3 in 1hr OR amount_deviation >= 3.0",
                "mandatory_approval": False,
                "applicable_actions": ["REQUEST_STEP_UP_AUTHENTICATION", "MONITOR_ACCOUNT", "BLOCK_TRANSACTION"],
                "regulatory_reference": "FFIEC Retail Payment Systems Handbook §4.2"
            },
            "POL-002": {
                "policy_code": "POL-002",
                "title": "Device Multi-Accounting & Farm Fingerprint Policy",
                "category": "Device Intelligence",
                "summary": "Any hardware device fingerprint associated with 3 or more distinct customer profiles or flagged as an emulated virtual machine must be subjected to biometric step-up verification or immediate containment.",
                "threshold_rules": "distinct_customers >= 3 OR is_emulator == true",
                "mandatory_approval": False,
                "applicable_actions": ["BLOCK_TRANSACTION", "WARN_CUSTOMER", "REQUEST_STEP_UP_AUTHENTICATION"],
                "regulatory_reference": "NIST SP 800-63B Authenticator Assurance Level 2 (AAL2)"
            },
            "POL-003": {
                "policy_code": "POL-003",
                "title": "Money Mule Pass-Through Network Policy",
                "category": "Anti-Money Laundering (AML)",
                "summary": "Accounts participating in rapid pass-through funds routing (hop count >= 3 within 24 hours of receipt) require immediate temporary debit freeze and mandatory escalation to Fraud / AML operations.",
                "threshold_rules": "mule_hops >= 3 AND holding_period_hours < 24",
                "mandatory_approval": True,
                "applicable_actions": ["BLOCK_TRANSACTION", "ESCALATE_TO_FRAUD_ANALYST", "FILE_REGULATORY_REPORT"],
                "regulatory_reference": "FinCEN Advisory FIN-2020-A003 on Money Mules"
            },
            "POL-004": {
                "policy_code": "POL-004",
                "title": "Uncertainty-Gated Step-Up Authentication Protocol",
                "category": "Step-Up Controls",
                "summary": "When fraud risk is elevated (>= 0.60) but graph or anomaly evidence is ambiguous/incomplete (uncertainty >= 0.35), the agent MUST request controlled out-of-band customer verification before taking destructive action.",
                "threshold_rules": "risk_score >= 0.60 AND uncertainty >= 0.35",
                "mandatory_approval": False,
                "applicable_actions": ["REQUEST_STEP_UP_AUTHENTICATION", "REQUEST_CUSTOMER_VERIFICATION"],
                "regulatory_reference": "PSD2 RTS Article 4 - Dynamic Linking & Strong Customer Authentication"
            },
            "POL-005": {
                "policy_code": "POL-005",
                "title": "High-Value Destructive Action & Human Approval Governance",
                "category": "Governance & Approvals",
                "summary": "Account blocking, permanent account suspension, or any transactional denial exceeding $2,000 USD must require human fraud analyst review and sign-off prior to final execution.",
                "threshold_rules": "action in ['BLOCK_TRANSACTION'] AND (amount >= 2000.0 OR uncertainty >= 0.50)",
                "mandatory_approval": True,
                "applicable_actions": ["REQUEST_HUMAN_APPROVAL", "ESCALATE_TO_FRAUD_ANALYST"],
                "regulatory_reference": "OCC Bulletin 2011-12 Sound Practices for Model Risk Management"
            },
            "POL-006": {
                "policy_code": "POL-006",
                "title": "Mandatory Suspicious Activity Reporting (SAR) Filing",
                "category": "Regulatory Compliance",
                "summary": "Transactions exceeding $5,000 USD involving confirmed syndicates, mule networks, or synthetic identities mandate the generation and filing of a Suspicious Activity Report with FinCEN within 30 days.",
                "threshold_rules": "amount >= 5000.0 AND pattern in ['Mule Ring', 'Synthetic Identity', 'Device Farming']",
                "mandatory_approval": True,
                "applicable_actions": ["FILE_REGULATORY_REPORT"],
                "regulatory_reference": "31 CFR § 1020.320 - Reports by banks of suspicious transactions"
            }
        }

        self.typologies = {
            "Device Farming": {
                "name": "Device Farming / Multi-Accounting",
                "indicators": [
                    "Single device fingerprint linked to multiple cards or customer IDs",
                    "Emulated mobile operating system (e.g. Bluestacks, Genymotion)",
                    "Rapid switching between accounts from identical browser user-agent"
                ],
                "recommended_investigation_steps": [
                    "trace_device_connections",
                    "trace_ip_connections",
                    "request_step_up_authentication"
                ],
                "default_policy": "POL-002"
            },
            "Account Takeover": {
                "name": "Account Takeover (ATO)",
                "indicators": [
                    "Transaction originating from a new device or unfamiliar IP range",
                    "Password or contact detail change within 48 hours prior to transaction",
                    "Unusual transaction amount or atypical merchant category"
                ],
                "recommended_investigation_steps": [
                    "search_customer_history",
                    "trace_device_connections",
                    "request_customer_verification"
                ],
                "default_policy": "POL-004"
            },
            "Card Testing & Velocity Burst": {
                "name": "Card Testing & Velocity Burst",
                "indicators": [
                    "Series of low-value transactions followed by an escalating large purchase",
                    "High frequency of attempts across multiple online merchants",
                    "High card rejection or CVV failure history"
                ],
                "recommended_investigation_steps": [
                    "detect_velocity_burst",
                    "trace_transaction_network",
                    "check_action_permission"
                ],
                "default_policy": "POL-001"
            },
            "Mule Network": {
                "name": "Money Mule Pass-Through Syndicate",
                "indicators": [
                    "Funds received via P2P/wire and transferred out in < 15 minutes",
                    "Account linked to known mule coordinator via multi-hop graph BFS",
                    "Discrepancy between stated customer income and transactional volume"
                ],
                "recommended_investigation_steps": [
                    "trace_mule_chain",
                    "trace_account_relationships",
                    "find_similar_fraud_cases"
                ],
                "default_policy": "POL-003"
            },
            "Synthetic Identity": {
                "name": "Synthetic Identity Fraud",
                "indicators": [
                    "Social security number / national ID associated with recent credit file",
                    "Disposable or newly created email domain",
                    "VoIP phone carrier used for verification"
                ],
                "recommended_investigation_steps": [
                    "search_customer_history",
                    "find_similar_fraud_cases",
                    "request_customer_verification"
                ],
                "default_policy": "POL-006"
            }
        }

    def retrieve_policy(self, query: str) -> List[Dict[str, Any]]:
        """
        Retrieves matching fraud policies based on keyword, pattern, or policy code.
        """
        q = query.lower()
        results = []
        for code, pol in self.policies.items():
            if (code.lower() in q or 
                pol["title"].lower() in q or 
                pol["category"].lower() in q or 
                pol["threshold_rules"].lower() in q or
                any(act.lower() in q for act in pol["applicable_actions"])):
                results.append(pol)
        
        # If no specific match, return top policies
        if not results:
            return list(self.policies.values())[:3]
        return results

    def retrieve_typology(self, pattern_query: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves typology details and recommended investigative steps.
        """
        q = pattern_query.lower()
        for key, typo in self.typologies.items():
            if key.lower() in q or typo["name"].lower() in q:
                return typo
        return self.typologies.get("Account Takeover")

# Singleton store
graphrag_store = GraphRAGStore()
