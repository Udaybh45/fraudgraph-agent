from typing import Dict, Any, List, Optional
from tigergraph.client import tg_client
from tigergraph.graph_store import graph_store

def search_customer_history(customer_id: str) -> Dict[str, Any]:
    """
    Retrieves historical transactions, baseline behaviors, and chargeback metrics for a customer.
    """
    customer = tg_client.get_vertex("Customer", customer_id)
    if not customer:
        return {
            "customer_id": customer_id,
            "found": False,
            "message": "Customer record not found in graph."
        }

    # Retrieve customer's accounts and historical txns
    accounts = graph_store.get_neighbors("Customer", customer_id, "owns")
    txns = []
    total_spend = 0.0
    for acc in accounts:
        acc_txns = graph_store.get_neighbors("Account", acc["vertex"]["id"], "makes")
        for t in acc_txns:
            txns.append(t["vertex"])
            total_spend += float(t["vertex"].get("amount", 0.0))

    avg_spend = round(total_spend / max(1, len(txns)), 2)
    return {
        "customer_id": customer_id,
        "found": True,
        "name": customer.get("name", "Unknown"),
        "kyc_status": customer.get("kyc_status", "VERIFIED"),
        "account_count": len(accounts),
        "total_historical_txns": len(txns),
        "total_historical_spend": round(total_spend, 2),
        "average_transaction_amount": avg_spend,
        "chargeback_count": customer.get("chargeback_count", 0),
        "customer_risk_rating": customer.get("risk_score", 0.1)
    }

def get_transaction_details(transaction_id: str) -> Dict[str, Any]:
    """
    Retrieves detailed attributes, attached device, IP, and merchant for a transaction.
    """
    txn = tg_client.get_vertex("Transaction", transaction_id)
    if not txn:
        return {"transaction_id": transaction_id, "found": False}

    devices = [d["vertex"] for d in graph_store.get_neighbors("Transaction", transaction_id, "uses")]
    ips = [i["vertex"] for i in graph_store.get_neighbors("Transaction", transaction_id, "originates_from")]
    merchants = [m["vertex"] for m in graph_store.get_neighbors("Transaction", transaction_id, "occurs_at")]
    accounts = [a["vertex"] for a in graph_store.get_neighbors("Transaction", transaction_id, "makes")]

    return {
        "transaction_id": transaction_id,
        "found": True,
        "amount": txn.get("amount", 0.0),
        "timestamp": txn.get("timestamp"),
        "product_code": txn.get("product_code", "W"),
        "channel": txn.get("channel", "ONLINE"),
        "anomaly_score": txn.get("anomaly_score", 0.2),
        "device": devices[0] if devices else None,
        "ip": ips[0] if ips else None,
        "merchant": merchants[0] if merchants else None,
        "account": accounts[0] if accounts else None
    }

def trace_device_connections(device_id: str) -> Dict[str, Any]:
    """
    Executes TigerGraph GSQL query to identify all customers, accounts, and cards sharing a physical device.
    """
    return tg_client.run_installed_query("trace_device_sharing", {"input_device": device_id})

def trace_ip_connections(ip_id: str) -> Dict[str, Any]:
    """
    Executes TigerGraph GSQL query to inspect IP subnet sharing, proxy flags, and cluster volume.
    """
    return tg_client.run_installed_query("trace_ip_cluster", {"input_ip": ip_id})

def trace_account_relationships(account_id: str, max_hops: int = 3) -> Dict[str, Any]:
    """
    Executes TigerGraph GSQL query trace_mule_chain to detect pass-through laundering or mule paths.
    """
    return tg_client.run_installed_query("trace_mule_chain", {"source_account": account_id, "max_hops": max_hops})

def trace_transaction_network(transaction_id: str, depth: int = 2) -> Dict[str, Any]:
    """
    Extracts multi-hop ego network around the transaction for visual analysis and graph feature extraction.
    """
    return tg_client.get_subgraph("Transaction", transaction_id, depth=depth)

def calculate_graph_risk(transaction_id: str) -> Dict[str, Any]:
    """
    Computes graph structural risk metric via TigerGraph GSQL accumulator query.
    """
    return tg_client.run_installed_query("calculate_graph_risk_metrics", {"target_txn": transaction_id})

def detect_fraud_patterns(transaction_id: str) -> Dict[str, Any]:
    """
    Evaluates multi-hop graph patterns to classify the fraud typology (Device Farming, ATO, Velocity Burst, Mule Network).
    """
    txn_info = get_transaction_details(transaction_id)
    if not txn_info.get("found"):
        return {"patterns_detected": [], "primary_pattern": None}

    patterns = []
    
    # 1. Device Farming Check
    dev = txn_info.get("device")
    if dev:
        dev_res = trace_device_connections(dev["id"])
        if dev_res.get("is_device_farm") or dev_res.get("distinct_customers", 0) >= 3:
            patterns.append({
                "name": "Device Farming / Multi-Accounting",
                "severity": "CRITICAL",
                "evidence": f"Device {dev['id']} shared across {dev_res.get('distinct_customers')} distinct customer accounts"
            })
        elif dev.get("is_emulator"):
            patterns.append({
                "name": "Emulated Device Fingerprint",
                "severity": "HIGH",
                "evidence": f"Virtual machine emulator environment identified: {dev.get('fingerprint')}"
            })

    # 2. IP Proxy & VPN Check
    ip = txn_info.get("ip")
    if ip:
        ip_res = trace_ip_connections(ip["id"])
        if ip.get("is_tor"):
            patterns.append({
                "name": "Tor Anonymized Exit Node",
                "severity": "HIGH",
                "evidence": f"Originating IP {ip.get('ip_address')} is a confirmed Tor exit relay"
            })
        elif ip_res.get("is_proxy_cluster"):
            patterns.append({
                "name": "Proxy/VPN Cluster Anomaly",
                "severity": "MEDIUM",
                "evidence": f"IP cluster contains {ip_res.get('customer_count')} accounts routing high volume"
            })

    # 3. Velocity Burst Check
    acc = txn_info.get("account")
    if acc:
        burst_res = tg_client.run_installed_query("detect_velocity_burst", {"target_account": acc["id"], "window_seconds": 3600})
        if burst_res.get("is_velocity_burst"):
            patterns.append({
                "name": "Card Testing & Velocity Burst",
                "severity": "HIGH",
                "evidence": f"Rapid velocity burst detected: {burst_res.get('txn_count')} transactions in 1 hour window"
            })

        # 4. Mule Chain Check
        mule_res = trace_account_relationships(acc["id"], max_hops=3)
        if mule_res.get("mule_chain_detected"):
            patterns.append({
                "name": "Money Mule Pass-Through Syndicate",
                "severity": "CRITICAL",
                "evidence": f"Account tied to {mule_res.get('chain_count')} rapid pass-through chains"
            })

    primary = patterns[0]["name"] if patterns else None
    return {
        "patterns_detected": patterns,
        "primary_pattern": primary,
        "pattern_count": len(patterns)
    }
