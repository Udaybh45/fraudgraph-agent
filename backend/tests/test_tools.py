import pytest
import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dataset.loader import load_dataset_into_graph
from tools import ALL_TOOLS
from uncertainty.engine import uncertainty_engine
from nba.engine import nba_engine
from memory.case_memory import case_memory

@pytest.fixture(scope="module", autouse=True)
def setup_graph():
    load_dataset_into_graph()

def test_device_sharing_detection():
    # DEV-FARM-EMU-01 is shared across multiple customers
    res = ALL_TOOLS["trace_device_connections"]("DEV-FARM-EMU-01")
    assert res.get("distinct_customers", 0) >= 3
    assert res.get("is_device_farm") is True

def test_ip_cluster_detection():
    # IP-TOR-101 has Tor and VPN attributes
    res = ALL_TOOLS["trace_ip_connections"]("IP-TOR-101")
    assert res.get("ip", {}).get("is_tor") is True
    assert res.get("is_proxy_cluster") is True

def test_uncertainty_engine_high_risk():
    ev_list = [
        {"description": "Device shared across 4 accounts", "polarity": "SUPPORTING", "source_tool": "trace_device_connections"},
        {"description": "Tor exit node", "polarity": "SUPPORTING", "source_tool": "trace_ip_connections"}
    ]
    assessment = uncertainty_engine.calculate_assessment(
        graph_risk=0.90,
        evidence_list=ev_list,
        similar_cases=[],
        anomaly_score=0.85,
        step_up_result=None
    )
    assert assessment["risk_level"] == "CRITICAL"
    assert assessment["confidence_score"] >= 0.70
    assert assessment["uncertainty_score"] <= 0.30

def test_next_best_action_human_approval_for_high_value():
    assessment = {
        "risk_score": 0.90,
        "risk_level": "CRITICAL",
        "confidence_score": 0.90,
        "uncertainty_score": 0.10,
        "additional_evidence_required": False,
        "supporting_evidence": [{"description": "Device Farm"}]
    }
    # Transaction amount > $2,000 threshold
    txn = {"amount": 3500.0}
    nba = nba_engine.determine_action(assessment, txn, "Device Farming")
    assert nba["action"] == "BLOCK_TRANSACTION"
    assert nba["is_sensitive"] is True
    assert "TIER_1" in nba["required_approval"]

def test_case_memory_similarity():
    query_features = {
        "case_id": "TEST-01",
        "fraud_pattern": "Device Farming / Multi-Accounting",
        "amount": 1900.0,
        "is_emulator": True,
        "is_vpn": True,
        "risk_score": 0.90
    }
    sims = case_memory.find_similar_cases(query_features, top_k=2)
    assert len(sims) > 0
    assert sims[0]["similarity_score"] > 0.60
