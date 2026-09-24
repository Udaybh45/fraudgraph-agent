const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (import.meta.env.PROD
      ? 'https://fraudgraph-agent.onrender.com/api'
      : '/api');

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchBenchmarks() {
  const res = await fetch(`${API_BASE}/benchmarks`);
  if (!res.ok) throw new Error('Failed to fetch benchmarks');
  return res.json();
}

export async function fetchBenchmarkResults() {
  const res = await fetch(`${API_BASE}/benchmark-results`);
  if (!res.ok) throw new Error('Failed to fetch benchmark results');
  return res.json();
}

export async function fetchCases() {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCase(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error('Failed to fetch case');
  return res.json();
}

export async function triggerInvestigation(transactionId, triggerReason = "High-Risk Alert", simulatedStepUp = null) {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_id: transactionId,
      trigger_reason: triggerReason,
      simulated_step_up_outcome: simulatedStepUp
    })
  });
  if (!res.ok) throw new Error('Investigation request failed');
  return res.json();
}

export async function approveCaseAction(caseId, payload) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Approval submission failed');
  return res.json();
}

export async function fetchTransactionGraph(transactionId, depth = 2) {
  const res = await fetch(`${API_BASE}/graph/${transactionId}?depth=${depth}`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}
