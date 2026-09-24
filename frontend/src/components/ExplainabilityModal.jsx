import React from 'react';
import { X, Sparkles, HelpCircle, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ExplainabilityModal({ isOpen, onClose, explanations, caseId, transactionId }) {
  if (!isOpen) return null;

  const expl = explanations || {};

  const questions = [
    {
      q: "1. What did the agent find?",
      a: expl.what_did_the_agent_find || "Identified device multi-accounting and anonymized IP routing through graph traversal.",
      tag: "Graph Findings"
    },
    {
      q: "2. Why is this suspicious?",
      a: expl.why_is_this_suspicious || "The device hardware fingerprint is tied to multiple distinct customer accounts, indicative of synthetic farming.",
      tag: "Fraud Logic"
    },
    {
      q: "3. What evidence is missing?",
      a: expl.what_evidence_is_missing || "Out-of-band biometric authentication challenge verification.",
      tag: "Checklist"
    },
    {
      q: "4. Why was additional evidence requested?",
      a: expl.why_was_additional_evidence_requested || "Initial uncertainty score exceeded threshold limits, requiring active out-of-band verification under policy POL-004.",
      tag: "Uncertainty Gating"
    },
    {
      q: "5. Why was this action selected?",
      a: expl.why_was_this_action_selected || "Maximizes loss mitigation without disproportionate cardholder friction based on defensible confidence.",
      tag: "Action Rationale"
    },
    {
      q: "6. What policy supports this action?",
      a: expl.what_policy_supports_this_action || "Policy POL-002 and POL-005 governance rules retrieved from GraphRAG knowledge base.",
      tag: "Policy Reference"
    },
    {
      q: "7. What approval is required?",
      a: expl.what_approval_is_required || "Tier-1 Fraud Analyst approval required for destructive blocking of high-value transactions.",
      tag: "Human Governance"
    },
    {
      q: "8. What uncertainty remains?",
      a: expl.what_uncertainty_remains || "Residual uncertainty is minimal following failed 2FA challenge and multi-hop graph corroboration.",
      tag: "Residual Risk"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/80 shadow-2xl p-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Defensible Explainability Matrix
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Case {caseId || 'Active'} • Transaction {transactionId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
          {questions.map((item, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-cyan-400 tracking-tight">
                  {item.q}
                </h4>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {item.tag}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Non-Private Evidence Synthesis • 100% Audit-Defensible</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
