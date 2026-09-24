import os
import sys
import json
import logging
from typing import Dict, Any

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dataset.generator import generate_hhgoa_ieee_dataset, DATASET_DIR
from tigergraph.client import tg_client
from memory.case_memory import case_memory

logger = logging.getLogger("FraudGraph.DatasetLoader")

def load_dataset_into_graph() -> Dict[str, Any]:
    """
    Cleans, extracts entities, and loads the HHGOA IEEE dataset into TigerGraph and case memory.
    """
    dataset_file = os.path.join(DATASET_DIR, "hhgoa_dataset.json")
    if not os.path.exists(dataset_file):
        dataset = generate_hhgoa_ieee_dataset()
    else:
        with open(dataset_file, "r", encoding="utf-8") as f:
            dataset = json.load(f)

    logger.info("Ingesting historical closed cases (Months 1-4)...")
    for hc in dataset.get("historical_cases", []):
        # Save into Case Memory
        case_memory.save_case(hc)
        
        # Load into TigerGraph
        c_id = hc["case_id"]
        tg_client.upsert_vertex("FraudCase", c_id, hc)
        
        # Create minimal entity vertices for historical cases
        ent = hc.get("entities", {})
        if ent.get("customer_id"):
            tg_client.upsert_vertex("Customer", ent["customer_id"], {
                "id": ent["customer_id"],
                "name": f"Historical Cardholder {ent['customer_id']}",
                "risk_score": hc.get("final_risk_score", 0.5),
                "kyc_status": "VERIFIED",
                "total_transactions": 25,
                "chargeback_count": 1 if "CONFIRMED_FRAUD" in hc.get("outcome", "") else 0
            })
        if ent.get("device_id"):
            tg_client.upsert_vertex("Device", ent["device_id"], {
                "id": ent["device_id"],
                "fingerprint": f"fp_hist_{ent['device_id']}",
                "device_type": "EMULATOR" if ent.get("is_emulator") else "DESKTOP",
                "os": "Windows/Linux",
                "browser": "Browser",
                "is_emulator": ent.get("is_emulator", False),
                "shared_user_count": 4 if ent.get("is_emulator") else 1
            })

    logger.info("Ingesting benchmark evaluation cases (Months 5-6) into graph...")
    for bc in dataset.get("benchmark_cases", []):
        txn_id = bc["transaction_id"]
        cust = bc["customer"]
        acc = bc["account"]
        dev = bc["device"]
        ip = bc["ip"]
        merch = bc["merchant"]

        # 1. Customer Vertex
        tg_client.upsert_vertex("Customer", cust["id"], {
            "id": cust["id"],
            "name": cust["name"],
            "risk_score": cust["risk_score"],
            "kyc_status": cust["kyc_status"],
            "total_transactions": 14,
            "chargeback_count": cust.get("chargeback_count", 0)
        })

        # 2. Account Vertex
        tg_client.upsert_vertex("Account", acc["id"], {
            "id": acc["id"],
            "account_number": acc["account_number"],
            "balance": acc["balance"],
            "status": acc["status"]
        })

        # 3. Transaction Vertex
        tg_client.upsert_vertex("Transaction", txn_id, {
            "id": txn_id,
            "amount": bc["amount"],
            "timestamp": f"2026-08-{10 + bc['case_index']}T14:32:00Z",
            "epoch_seconds": 1723290720 + (bc["day_offset"] * 86400),
            "currency": "USD",
            "channel": "ONLINE",
            "product_code": "W",
            "anomaly_score": bc["anomaly_score"],
            "is_risky": bc["anomaly_score"] > 0.6
        })

        # 4. Device Vertex
        tg_client.upsert_vertex("Device", dev["id"], {
            "id": dev["id"],
            "fingerprint": dev["fingerprint"],
            "device_type": dev["device_type"],
            "os": dev["os"],
            "browser": dev["browser"],
            "is_emulator": dev["is_emulator"],
            "shared_user_count": len(dev.get("shared_with_customers", [cust["id"]]))
        })

        # 5. IP Vertex
        tg_client.upsert_vertex("IP", ip["id"], {
            "id": ip["id"],
            "ip_address": ip["ip_address"],
            "country": ip["country"],
            "is_vpn": ip["is_vpn"],
            "is_tor": ip["is_tor"],
            "risk_score": ip["risk_score"]
        })

        # 6. Merchant Vertex
        tg_client.upsert_vertex("Merchant", merch["id"], {
            "id": merch["id"],
            "name": merch["name"],
            "category": merch["category"],
            "risk_tier": merch["risk_tier"]
        })

        # EDGES
        tg_client.upsert_edge("owns", "Customer", cust["id"], "Account", acc["id"])
        tg_client.upsert_edge("makes", "Account", acc["id"], "Transaction", txn_id)
        tg_client.upsert_edge("uses", "Transaction", txn_id, "Device", dev["id"])
        tg_client.upsert_edge("originates_from", "Transaction", txn_id, "IP", ip["id"])
        tg_client.upsert_edge("occurs_at", "Transaction", txn_id, "Merchant", merch["id"])
        tg_client.upsert_edge("customer_uses_device", "Customer", cust["id"], "Device", dev["id"])

        # Link shared customers on device if multi-accounting
        for other_cid in dev.get("shared_with_customers", []):
            if other_cid != cust["id"]:
                tg_client.upsert_vertex("Customer", other_cid, {
                    "id": other_cid,
                    "name": f"Syndicate Alias {other_cid}",
                    "risk_score": 0.85,
                    "kyc_status": "SUSPICIOUS"
                })
                tg_client.upsert_edge("customer_uses_device", "Customer", other_cid, "Device", dev["id"])

    logger.info("Graph and case memory loading complete.")
    return {
        "status": "LOADED",
        "historical_cases_count": len(dataset.get("historical_cases", [])),
        "benchmark_cases_count": len(dataset.get("benchmark_cases", []))
    }

if __name__ == "__main__":
    res = load_dataset_into_graph()
    print("Dataset loading result:", res)
