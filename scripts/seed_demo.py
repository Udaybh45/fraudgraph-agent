import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dataset.benchmark_runner import run_all_benchmarks
from dataset.loader import load_dataset_into_graph

if __name__ == "__main__":
    print("=" * 60)
    print("SEEDING FRAUDGRAPH AGENT DEMO & KNOWLEDGE GRAPH")
    print("=" * 60)
    load_dataset_into_graph()
    run_all_benchmarks()
    print("\nFraudGraph Agent knowledge graph seeded successfully!")
