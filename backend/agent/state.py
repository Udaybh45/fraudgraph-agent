from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class InvestigationState(BaseModel):
    # Lifecycle identifiers
    case_id: Optional[str] = None
    transaction_id: str
    trigger_reason: str
    status: str = "TRIGGER"
    current_step_index: int = 0
    
    # Graph & Entity context
    customer: Optional[Dict[str, Any]] = None
    account: Optional[Dict[str, Any]] = None
    transaction: Optional[Dict[str, Any]] = None
    device: Optional[Dict[str, Any]] = None
    ip: Optional[Dict[str, Any]] = None
    merchant: Optional[Dict[str, Any]] = None
    
    # Graph findings & patterns
    device_sharing: Optional[Dict[str, Any]] = None
    ip_cluster: Optional[Dict[str, Any]] = None
    mule_chain: Optional[Dict[str, Any]] = None
    velocity_burst: Optional[Dict[str, Any]] = None
    fraud_pattern: Optional[str] = None
    graph_risk_metrics: Optional[Dict[str, Any]] = None
    subgraph: Optional[Dict[str, Any]] = None
    
    # Evidence & History
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    customer_history: Optional[Dict[str, Any]] = None
    similar_cases: List[Dict[str, Any]] = Field(default_factory=list)
    applicable_policies: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Uncertainty & Risk Assessment
    risk_assessment: Optional[Dict[str, Any]] = None
    initial_nba: Optional[Dict[str, Any]] = None
    
    # Additional Evidence Step
    additional_evidence_requested: Optional[str] = None
    additional_evidence_result: Optional[str] = None
    post_evidence_assessment: Optional[Dict[str, Any]] = None
    
    # Decisioning & Governance
    next_best_action: Optional[Dict[str, Any]] = None
    permission_check: Optional[Dict[str, Any]] = None
    approval_status: Optional[str] = None  # AUTOMATED, PENDING_APPROVAL, APPROVED, REJECTED
    executed_action: Optional[Dict[str, Any]] = None
    
    # Explainability & Timeline
    explanations: Optional[Dict[str, str]] = None
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Telemetry
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    total_execution_ms: int = 0
