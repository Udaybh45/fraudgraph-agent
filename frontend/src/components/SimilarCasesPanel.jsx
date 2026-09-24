import React from 'react';
import { Database, GitCompare, ArrowUpRight, History } from 'lucide-react';

export default function SimilarCasesPanel({ similarCases }) {
  const cases = similarCases || [];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Similar Historical Cases (Case Memory)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          Months 1-4 Knowledge Base
        </span>
      </div>

      <div className="space-y-3">
        {cases.length > 0 ? (
          cases.map((sc, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {sc.case_id || sc.case_number}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                    {sc.similarity_pct || Math.round(Number(sc.similarity_score || 0.8) * 100)}% Match
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ${Number(sc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 mb-2 font-medium">
                Typology: <span className="text-cyan-400">{sc.fraud_pattern || 'Unclassified'}</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Historical Resolution:</span>
                  <span className={`font-semibold ${sc.outcome === 'CONFIRMED_FRAUD' || sc.outcome === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {sc.outcome || 'RESOLVED'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Historical Action:</span>
                  <span className="font-mono text-slate-200">{sc.action || sc.actions?.[0] || 'BLOCK_TRANSACTION'}</span>
                </div>
                {sc.relevance_explanation && (
                  <p className="text-slate-400 pt-1 border-t border-slate-800 text-[10px] italic">
                    {sc.relevance_explanation}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic p-3 text-center">
            No matching prior cases above similarity threshold.
          </p>
        )}
      </div>
    </div>
  );
}
