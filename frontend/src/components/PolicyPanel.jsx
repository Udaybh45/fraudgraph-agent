import React from 'react';
import { BookOpen, Scale, ShieldCheck } from 'lucide-react';

export default function PolicyPanel({ policies, fraudPattern }) {
  const pols = policies || [];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            GraphRAG Policy & Governance Context
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          Typology: {fraudPattern || 'Pattern Anomaly'}
        </span>
      </div>

      <div className="space-y-3">
        {pols.map((p, i) => (
          <div
            key={i}
            className="glass-card rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {p.policy_code} • {p.title}
              </span>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {p.category}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
              {p.summary}
            </p>

            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-900 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Threshold Trigger:</span>
                <span className="font-mono text-amber-300">{p.threshold_rules}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regulatory Reference:</span>
                <span className="text-slate-300 font-medium">{p.regulatory_reference}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
