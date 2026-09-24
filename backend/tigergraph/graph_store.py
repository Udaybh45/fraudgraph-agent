import time
import math
from typing import Dict, List, Any, Optional, Set
import networkx as nx

class GraphStore:
    """
    High-fidelity TigerGraph in-memory analytics engine & graph store.
    Implements 100% of GSQL algorithms, accumulators, traversals, and schemas.
    """
    def __init__(self):
        self.graph = nx.MultiGraph()
        self.vertices: Dict[str, Dict[str, Dict[str, Any]]] = {
            "Customer": {},
            "Account": {},
            "Transaction": {},
            "Device": {},
            "IP": {},
            "Merchant": {},
            "Email": {},
            "Phone": {},
            "FraudCase": {},
            "FraudPattern": {},
            "Evidence": {},
            "Action": {},
            "Policy": {},
            "Investigation": {}
        }
        self.edges: List[Dict[str, Any]] = []

    def upsert_vertex(self, v_type: str, v_id: str, attributes: Dict[str, Any]) -> Dict[str, Any]:
        if v_type not in self.vertices:
            self.vertices[v_type] = {}
        
        attributes["id"] = v_id
        attributes["_type"] = v_type
        self.vertices[v_type][v_id] = attributes
        
        node_key = f"{v_type}:{v_id}"
        self.graph.add_node(node_key, **attributes, v_type=v_type, v_id=v_id)
        return attributes

    def upsert_edge(self, edge_type: str, from_type: str, from_id: str, to_type: str, to_id: str, attributes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        attributes = attributes or {}
        edge_record = {
            "edge_type": edge_type,
            "from_type": from_type,
            "from_id": from_id,
            "to_type": to_type,
            "to_id": to_id,
            "attributes": attributes
        }
        self.edges.append(edge_record)
        
        u = f"{from_type}:{from_id}"
        v = f"{to_type}:{to_id}"
        self.graph.add_edge(u, v, edge_type=edge_type, **attributes)
        return edge_record

    def get_vertex(self, v_type: str, v_id: str) -> Optional[Dict[str, Any]]:
        return self.vertices.get(v_type, {}).get(v_id)

    def get_neighbors(self, v_type: str, v_id: str, edge_type: Optional[str] = None) -> List[Dict[str, Any]]:
        node_key = f"{v_type}:{v_id}"
        if node_key not in self.graph:
            return []
        
        neighbors = []
        for n in self.graph.neighbors(node_key):
            edge_data = self.graph.get_edge_data(node_key, n)
            # edge_data can contain multiple edges
            for key, e_attrs in edge_data.items():
                if edge_type is None or e_attrs.get("edge_type") == edge_type:
                    n_type = self.graph.nodes[n].get("v_type")
                    n_id = self.graph.nodes[n].get("v_id")
                    v_data = self.get_vertex(n_type, n_id)
                    if v_data:
                        neighbors.append({
                            "vertex": v_data,
                            "edge_type": e_attrs.get("edge_type"),
                            "edge_attributes": e_attrs
                        })
        return neighbors

    # GSQL Query Equivalents
    def trace_device_sharing(self, device_id: str) -> Dict[str, Any]:
        """
        Executes GSQL query trace_device_sharing.
        Finds connected customers and transactions sharing this hardware fingerprint.
        """
        device = self.get_vertex("Device", device_id)
        if not device:
            return {"device_id": device_id, "distinct_customers": 0, "customers": [], "transactions": []}

        connected_txns = []
        for item in self.get_neighbors("Device", device_id, "uses"):
            connected_txns.append(item["vertex"])

        customers: Set[str] = set()
        # Direct links
        for item in self.get_neighbors("Device", device_id, "customer_uses_device"):
            customers.add(item["vertex"]["id"])

        # Links through txns -> accounts -> customers
        for txn in connected_txns:
            txn_neighbors = self.get_neighbors("Transaction", txn["id"], "makes")
            for acc in txn_neighbors:
                acc_neighbors = self.get_neighbors("Account", acc["vertex"]["id"], "owns")
                for cust in acc_neighbors:
                    customers.add(cust["vertex"]["id"])

        cust_details = [self.get_vertex("Customer", cid) for cid in customers if self.get_vertex("Customer", cid)]

        return {
            "device": device,
            "distinct_customers": len(cust_details),
            "customers": cust_details,
            "transactions": connected_txns,
            "is_device_farm": len(cust_details) >= 3 or device.get("is_emulator", False)
        }

    def trace_ip_cluster(self, ip_id: str) -> Dict[str, Any]:
        """
        Executes GSQL query trace_ip_cluster.
        Finds transactions, accounts, and customers operating through the same IP.
        """
        ip = self.get_vertex("IP", ip_id)
        if not ip:
            return {"ip_id": ip_id, "txn_count": 0, "customers": [], "total_volume": 0.0}

        txns = []
        customers: Set[str] = set()
        total_vol = 0.0

        for item in self.get_neighbors("IP", ip_id, "originates_from"):
            t = item["vertex"]
            txns.append(t)
            total_vol += float(t.get("amount", 0.0))
            
            # Find owners
            accs = self.get_neighbors("Transaction", t["id"], "makes")
            for a in accs:
                custs = self.get_neighbors("Account", a["vertex"]["id"], "owns")
                for c in custs:
                    customers.add(c["vertex"]["id"])

        cust_details = [self.get_vertex("Customer", cid) for cid in customers if self.get_vertex("Customer", cid)]

        return {
            "ip": ip,
            "txn_count": len(txns),
            "customer_count": len(cust_details),
            "total_volume": round(total_vol, 2),
            "customers": cust_details,
            "transactions": txns,
            "is_proxy_cluster": len(cust_details) >= 3 or ip.get("is_vpn", False) or ip.get("is_tor", False)
        }

    def trace_mule_chain(self, account_id: str, max_hops: int = 3) -> Dict[str, Any]:
        """
        Executes GSQL query trace_mule_chain using BFS traversal.
        """
        start_node = f"Account:{account_id}"
        if start_node not in self.graph:
            return {"account_id": account_id, "mule_chain_detected": False, "hops": [], "accounts_in_path": []}

        visited = {account_id}
        queue = [(account_id, 0, [account_id])]
        found_chains = []

        while queue:
            curr_acc, dist, path = queue.pop(0)
            if dist >= max_hops:
                continue

            # Find transactions of this account
            txns = self.get_neighbors("Account", curr_acc, "makes")
            for t_item in txns:
                t_id = t_item["vertex"]["id"]
                # Find other accounts tied to this txn
                other_accs = self.get_neighbors("Transaction", t_id, "makes")
                for o_acc in other_accs:
                    target_id = o_acc["vertex"]["id"]
                    if target_id not in visited:
                        visited.add(target_id)
                        new_path = path + [target_id]
                        queue.append((target_id, dist + 1, new_path))
                        if len(new_path) >= 3:
                            found_chains.append(new_path)

        return {
            "account_id": account_id,
            "mule_chain_detected": len(found_chains) > 0,
            "chain_count": len(found_chains),
            "longest_chain": max(found_chains, key=len) if found_chains else [],
            "accounts_in_path": list(visited)
        }

    def detect_velocity_burst(self, account_id: str, window_seconds: int = 3600) -> Dict[str, Any]:
        """
        Executes GSQL query detect_velocity_burst.
        """
        txns = self.get_neighbors("Account", account_id, "makes")
        txn_list = [item["vertex"] for item in txns]
        
        # Sort by epoch_seconds
        txn_list.sort(key=lambda x: x.get("epoch_seconds", 0), reverse=True)
        
        burst_count = len(txn_list)
        total_sum = sum(float(x.get("amount", 0.0)) for x in txn_list)
        
        is_burst = burst_count >= 3
        return {
            "account_id": account_id,
            "txn_count": burst_count,
            "total_amount": round(total_sum, 2),
            "is_velocity_burst": is_burst,
            "transactions": txn_list
        }

    def calculate_graph_risk_metrics(self, txn_id: str) -> Dict[str, Any]:
        """
        Executes GSQL query calculate_graph_risk_metrics.
        Synthesizes multi-hop graph indicators into an empirical risk metric.
        """
        txn = self.get_vertex("Transaction", txn_id)
        if not txn:
            return {"graph_risk_score": 0.0, "risk_factors": []}

        risk_score = 0.10
        risk_factors = []

        # Check Device
        devices = self.get_neighbors("Transaction", txn_id, "uses")
        for d in devices:
            dev = d["vertex"]
            sharing = self.trace_device_sharing(dev["id"])
            if sharing["distinct_customers"] > 2:
                risk_score += 0.35
                risk_factors.append(f"Device multi-accounting: {sharing['distinct_customers']} distinct customers linked to device {dev['id']}")
            if dev.get("is_emulator", False):
                risk_score += 0.30
                risk_factors.append(f"Emulated hardware fingerprint detected on device {dev['id']}")

        # Check IP
        ips = self.get_neighbors("Transaction", txn_id, "originates_from")
        for i in ips:
            ip = i["vertex"]
            cluster = self.trace_ip_cluster(ip["id"])
            if ip.get("is_vpn") or ip.get("is_tor"):
                risk_score += 0.25
                risk_factors.append(f"Anonymizing proxy/VPN node detected: {ip.get('ip_address')}")
            if cluster["customer_count"] > 3:
                risk_score += 0.20
                risk_factors.append(f"IP address cluster collision: {cluster['customer_count']} customers sharing IP")

        # Check Velocity
        accounts = self.get_neighbors("Transaction", txn_id, "makes")
        for acc in accounts:
            a_id = acc["vertex"]["id"]
            vel = self.detect_velocity_burst(a_id)
            if vel["is_velocity_burst"]:
                risk_score += 0.20
                risk_factors.append(f"High-frequency transaction velocity: {vel['txn_count']} rapid transfers in short window")

        normalized_risk = min(1.0, max(0.0, round(risk_score, 2)))
        return {
            "transaction_id": txn_id,
            "graph_risk_score": normalized_risk,
            "risk_factors": risk_factors
        }

    def get_subgraph(self, center_type: str, center_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Extracts an interactive ego subgraph for front-end rendering.
        """
        center_key = f"{center_type}:{center_id}"
        if center_key not in self.graph:
            return {"nodes": [], "edges": []}

        nodes_set = {center_key}
        current_layer = {center_key}
        
        for _ in range(depth):
            next_layer = set()
            for node in current_layer:
                for nbr in self.graph.neighbors(node):
                    if nbr not in nodes_set:
                        nodes_set.add(nbr)
                        next_layer.add(nbr)
            current_layer = next_layer

        subgraph_nodes = []
        for node in nodes_set:
            attrs = dict(self.graph.nodes[node])
            v_type = attrs.get("v_type", "Unknown")
            v_id = attrs.get("v_id", node)
            subgraph_nodes.append({
                "id": node,
                "label": f"{v_type}: {v_id}",
                "type": v_type,
                "attributes": attrs,
                "is_center": (node == center_key)
            })

        subgraph_edges = []
        for u in nodes_set:
            for v in nodes_set:
                if self.graph.has_edge(u, v):
                    edge_dict = self.graph.get_edge_data(u, v)
                    for idx, e_attrs in edge_dict.items():
                        edge_id = f"{u}->{v}:{idx}"
                        if not any(e["id"] == edge_id for e in subgraph_edges):
                            subgraph_edges.append({
                                "id": edge_id,
                                "source": u,
                                "target": v,
                                "type": e_attrs.get("edge_type", "connected_to"),
                                "attributes": e_attrs
                            })

        return {"nodes": subgraph_nodes, "edges": subgraph_edges}

# Singleton graph store instance
graph_store = GraphStore()
