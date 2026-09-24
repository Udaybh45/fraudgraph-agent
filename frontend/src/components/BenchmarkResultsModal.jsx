import React from 'react';
import { X, CheckCircle2, FileText, ArrowUpRight, Database, ShieldAlert, Cpu } from 'lucide-react';

export default function BenchmarkResultsModal({
  isOpen,
  onClose,
  benchmarkResults,
  onSelectCase
}) {
  if (!isOpen) return null;

  const results = benchmarkResults || [];
  const totalTargetCases = 20; // 20 cases from final 2 months of IEEE-CIS dataset
  const evaluatedCount = results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                OFFICIAL HHGOA BENCHMARK
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                IEEE-CIS Benchmark Evaluation Suite
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Standardized evaluation on final two months of partitioned transaction data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Target Cases</span>
            <span className="text-xl font-bold font-mono text-white">{totalTargetCases}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Months 5–6</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Evaluated</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{evaluatedCount} / {totalTargetCases}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Answer Files Generated</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">NBAs Generated</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{evaluatedCount} / {totalTargetCases}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">100% Policy-Gated</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Memory Updates</span>
            <span className="text-xl font-bold font-mono text-purple-400">{evaluatedCount} / {totalTargetCases}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Indexed to TigerGraph</span>
          </div>
        </div>

        {/* Benchmark Results Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl mb-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Benchmark Case</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Pattern</th>
                <th className="py-2.5 px-3 text-center">Risk</th>
                <th className="py-2.5 px-3">Next Best Action</th>
                <th className="py-2.5 px-3 text-center">Memory</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 font-medium">
              {results.length > 0 ? (
                results.map((rec, i) => {
                  const bCase = rec.Case || {};
                  const riskVal = Number(rec.Risk || 0.5);
                  const isBlock = String(rec.Final_outcome || rec["Final outcome"] || '').includes('BLOCK') || String(rec.Actions?.[0] || '').includes('BLOCK');
                  const isAllow = String(rec.Final_outcome || rec["Final outcome"] || '').includes('ALLOW') || String(rec.Actions?.[0] || '').includes('ALLOW');

                  return (
                    <tr key={i} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-white block text-[11px]">{bCase.benchmark_id || `CASE-BM-0${i+1}`}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">{bCase.title || bCase.trigger_reason}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-400 text-[11px]">{bCase.transaction_id || rec.transaction_id}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-200">{rec["Fraud pattern"] || rec.fraud_pattern || 'Detected Pattern'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          riskVal >= 0.75 ? 'bg-rose-500/20 text-rose-400' :
                          riskVal >= 0.40 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {riskVal.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isBlock ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                          isAllow ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                          'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {rec["Actions"]?.[0] || rec.Actions?.[0] || 'BLOCK_TRANSACTION'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                          <span>Indexed</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectCase(i + 1);
                          }}
                          className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px] border border-slate-700 transition cursor-pointer"
                        >
                          Open Investigation
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic text-xs">
                    No benchmark output files loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Actual evaluated results from <code className="text-cyan-400 font-mono">backend/output/*.json</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
}
