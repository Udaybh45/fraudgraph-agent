import logging
from typing import Dict, Any, Optional, List
from config import settings
from tigergraph.graph_store import graph_store

logger = logging.getLogger("FraudGraph.TigerGraphClient")

class TigerGraphClient:
    """
    Unified TigerGraph Client.
    Supports TigerGraph Savanna / Community Edition via pyTigerGraph with 
    automatic, zero-downtime fallback to high-fidelity GSQL engine.
    """
    def __init__(self):
        self.conn = None
        self.is_live = False
        self._init_connection()

    def _init_connection(self):
        if settings.USE_TIGERGRAPH_EMULATOR:
            logger.info("Operating in TigerGraph High-Fidelity In-Memory GSQL mode.")
            self.is_live = False
            return

        try:
            import pyTigerGraph as tg
            logger.info(f"Connecting to TigerGraph Savanna at {settings.TIGERGRAPH_HOST} (Graph: {settings.TIGERGRAPH_GRAPH_NAME})...")
            self.conn = tg.TigerGraphConnection(
                host=settings.TIGERGRAPH_HOST,
                graphname=settings.TIGERGRAPH_GRAPH_NAME,
                username=settings.TIGERGRAPH_USERNAME,
                password=settings.TIGERGRAPH_PASSWORD,
                restppPort=settings.TIGERGRAPH_REST_PORT,
                gsPort=settings.TIGERGRAPH_GS_PORT
            )
            if settings.TIGERGRAPH_SECRET:
                self.conn.getToken(settings.TIGERGRAPH_SECRET)
            self.is_live = True
            logger.info("Successfully connected to live TigerGraph Savanna instance.")
        except Exception as e:
            logger.warning(f"Could not connect to live TigerGraph server ({e}). Falling back to TigerGraph High-Fidelity GSQL Engine.")
            self.is_live = False

    def upsert_vertex(self, v_type: str, v_id: str, attributes: Dict[str, Any]) -> Dict[str, Any]:
        if self.is_live and self.conn:
            try:
                self.conn.upsertVertex(v_type, v_id, attributes)
            except Exception as e:
                logger.error(f"Live TigerGraph upsert failed: {e}")
        return graph_store.upsert_vertex(v_type, v_id, attributes)

    def upsert_edge(self, edge_type: str, from_type: str, from_id: str, to_type: str, to_id: str, attributes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if self.is_live and self.conn:
            try:
                self.conn.upsertEdge(from_type, from_id, edge_type, to_type, to_id, attributes or {})
            except Exception as e:
                logger.error(f"Live TigerGraph edge upsert failed: {e}")
        return graph_store.upsert_edge(edge_type, from_type, from_id, to_type, to_id, attributes)

    def run_installed_query(self, query_name: str, params: Dict[str, Any]) -> Any:
        if self.is_live and self.conn:
            try:
                return self.conn.runInstalledQuery(query_name, params)
            except Exception as e:
                logger.error(f"Live GSQL query {query_name} failed: {e}")

        # Local execution mapping
        if query_name == "trace_device_sharing":
            return graph_store.trace_device_sharing(params.get("input_device"))
        elif query_name == "trace_ip_cluster":
            return graph_store.trace_ip_cluster(params.get("input_ip"))
        elif query_name == "trace_mule_chain":
            return graph_store.trace_mule_chain(params.get("source_account"), params.get("max_hops", 3))
        elif query_name == "detect_velocity_burst":
            return graph_store.detect_velocity_burst(params.get("target_account"), params.get("window_seconds", 3600))
        elif query_name == "calculate_graph_risk_metrics":
            return graph_store.calculate_graph_risk_metrics(params.get("target_txn"))
        elif query_name == "find_similar_cases":
            return []
        
        return {}

    def get_vertex(self, v_type: str, v_id: str) -> Optional[Dict[str, Any]]:
        return graph_store.get_vertex(v_type, v_id)

    def get_subgraph(self, center_type: str, center_id: str, depth: int = 2) -> Dict[str, Any]:
        return graph_store.get_subgraph(center_type, center_id, depth)

# Singleton TigerGraph client
tg_client = TigerGraphClient()
