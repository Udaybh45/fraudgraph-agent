import os
import sys
import json
import logging
from typing import Dict, Any, List

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dataset.loader import load_dataset_into_graph, DATASET_DIR
from agent.workflow import fraud_agent
from tigergraph.client import tg_client

logger = logging.getLogger("FraudGraph.BenchmarkRunner")
OUTPUT_DIR = os.path.abspath(os.path.join(DATASET_DIR, "..", "output"))

def run_all_benchmarks() -> List[Dict[str, Any]]:
    """
    Executes the autonomous agent against all benchmark cases (Months 5-6).
    Generates required hackathon answer files and records findings in TigerGraph.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    load_dataset_into_graph()

    dataset_file = os.path.join(DATASET_DIR, "hhgoa_dataset.json")
    with open(dataset_file, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    benchmark_cases = dataset.get("benchmark_cases", [])
    results = []

    print("=" * 70)
    print(f"FRAUDGRAPH AGENT: RUNNING BENCHMARK EVALUATION ({len(benchmark_cases)} CASES)")
    print("=" * 70)

    for bc in benchmark_cases:
        b_id = bc["benchmark_id"]
        txn_id = bc["transaction_id"]
        trigger = bc["trigger_reason"]
        sim_step_up = bc.get("simulated_step_up")

        print(f"\n[EVALUATION] Starting Investigation for {b_id} (Txn: {txn_id})...")
        print(f"             Title: {bc['title']}")
        print(f"             Trigger: {trigger}")

        state = fraud_agent.run_investigation(
            transaction_id=txn_id,
            trigger_reason=trigger,
            simulated_step_up_outcome=sim_step_up
        )

        # Build official hackathon answer record
        answer_record = {
            "Case": {
                "benchmark_id": b_id,
                "case_id": state.case_id,
                "transaction_id": txn_id,
                "title": bc["title"],
                "trigger_reason": trigger,
                "expected_scenario": bc.get("expected_scenario")
            },
            "Investigation record": {
                "started_at": state.started_at,
                "completed_at": state.completed_at,
                "execution_time_ms": state.total_execution_ms,
                "steps_executed": len(state.timeline),
                "timeline": state.timeline
            },
            "Evidence": state.evidence,
            "Findings": state.explanations.get("what_did_the_agent_find") if state.explanations else "",
            "Fraud pattern": state.fraud_pattern,
            "Risk": state.post_evidence_assessment.get("risk_score") if state.post_evidence_assessment else 0.5,
            "Confidence": state.post_evidence_assessment.get("confidence_score") if state.post_evidence_assessment else 0.5,
            "Decisions": {
                "pre_evidence_action": state.initial_nba.get("action") if state.initial_nba else None,
                "additional_evidence_dispatched": state.additional_evidence_requested is not None,
                "final_recommended_action": state.next_best_action.get("action") if state.next_best_action else None,
                "status": state.status
            },
            "Actions": [state.next_best_action.get("action")] if state.next_best_action else [],
            "Required approval": state.next_best_action.get("required_approval") if state.next_best_action else "AUTOMATED_EXECUTION",
            "Next Best Action before additional evidence": state.initial_nba,
            "Additional evidence requested": state.additional_evidence_requested,
            "Result of additional evidence": state.additional_evidence_result,
            "Updated Next Best Action": state.next_best_action,
            "Final outcome": "BLOCKED" if "BLOCK" in str(state.next_best_action.get("action")) else ("MONITORED" if "MONITOR" in str(state.next_best_action.get("action")) else "ALLOWED"),
            "Case memory entry": {
                "case_id": state.case_id,
                "transaction_id": txn_id,
                "fraud_pattern": state.fraud_pattern,
                "final_risk_score": state.post_evidence_assessment.get("risk_score") if state.post_evidence_assessment else 0.5,
                "confidence_score": state.post_evidence_assessment.get("confidence_score") if state.post_evidence_assessment else 0.5,
                "resolution": "RESOLVED"
            },
            "Explainability": state.explanations
        }

        # Write to TigerGraph Investigation vertex & edge
        inv_id = f"INV-{state.case_id}"
        tg_client.upsert_vertex("Investigation", inv_id, {
            "id": inv_id,
            "agent_name": "FraudGraph_Autonomous_Agent",
            "steps_count": len(state.timeline),
            "runtime_ms": state.total_execution_ms,
            "started_at": state.started_at or "",
            "completed_at": state.completed_at or "",
            "outcome": answer_record["Final outcome"]
        })
        if state.case_id:
            tg_client.upsert_edge("logged_investigation", "FraudCase", state.case_id, "Investigation", inv_id)

        # Save individual JSON answer file
        ans_filename = f"{b_id.lower().replace('-', '_')}_answer.json"
        ans_filepath = os.path.join(OUTPUT_DIR, ans_filename)
        with open(ans_filepath, "w", encoding="utf-8") as f:
            json.dump(answer_record, f, indent=2)

        print(f"             Result: Action={state.next_best_action.get('action')} | Risk={answer_record['Risk']} | Confidence={answer_record['Confidence']}")
        print(f"             Output saved to: {ans_filename}")

        results.append(answer_record)

    # Save consolidated benchmark summary
    summary_path = os.path.join(OUTPUT_DIR, "all_benchmark_answers.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 70)
    print(f"BENCHMARK COMPLETE: {len(results)} answer files successfully generated in {OUTPUT_DIR}")
    print("=" * 70)
    return results

if __name__ == "__main__":
    run_all_benchmarks()
