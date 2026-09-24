import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Circle, Activity, User, DollarSign, Hash } from 'lucide-react';

export default function Sidebar({ caseData, currentStepIndex, skippedStepIndices = [], isInvestigating }) {
  const txn = caseData?.transaction || {};
  const cust = caseData?.customer || {};
  const nba = caseData?.next_best_action || {};
  const assessment = caseData?.post_evidence_assessment || caseData?.risk_assessment || {};
  const risk = assessment.risk_score ?? txn?.anomaly_score ?? 0;
  const confidence = assessment.confidence_score ?? 0;
  const uncertainty = assessment.uncertainty_score ?? 0;

  const riskColor = risk >= 0.75 ? 'text-rose-400' : risk >= 0.4 ? 'text-amber-400' : 'text-emerald-400';
  const riskBg   = risk >= 0.75 ? 'bg-rose-500/15 border-rose-500/40' : risk >= 0.4 ? 'bg-amber-500/15 border-amber-500/40' : 'bg-emerald-500/15 border-emerald-500/40';

  // Milestones tied to step indices
  const milestones = [
    { label: 'Case created',               stepMin: 1 },
    { label: 'TigerGraph queried',          stepMin: 2 },
    { label: 'Evidence gathered',           stepMin: 3 },
    { label: 'Fraud pattern identified',    stepMin: 4 },
    { label: 'Risk & uncertainty assessed', stepMin: 5 },
    { label: 'Next Best Action selected',   stepMin: 8 },
    { label: 'Policy validated',            stepMin: 9 },
    { label: 'Investigation resolved',      stepMin: 12 },
  ];

  const nbaAction = nba?.action || '';
  const nbaIsBlock  = nbaAction.includes('BLOCK');
  const nbaIsAllow  = nbaAction.includes('ALLOW');
  const nbaIsMonitor = nbaAction.includes('MONITOR');

  const isEvidenceSufficient = skippedStepIndices.includes(6);
  const isApprovalRequired   = !skippedStepIndices.includes(10);

  return (
    <aside className="w-72 shrink-0 border-r border-slate-800 bg-[#0b101e] overflow-y-auto flex flex-col gap-0">

      {/* ── CASE FACTS ───────────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Case File</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            caseData?.status === 'RESOLVED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            {caseData?.status || 'ACTIVE'}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Case ID</span>
            <span className="font-mono font-bold text-white text-sm">{caseData?.case_id || '—'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Transaction</span>
            <span className="font-mono font-semibold text-cyan-400">{caseData?.transaction_id || txn?.id || '—'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Customer</span>
              <span className="text-slate-200 font-medium text-xs">{cust?.name || cust?.id || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Amount</span>
              <span className="font-mono font-bold text-emerald-400">
                ${Number(txn?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Trigger</span>
            <span className="text-slate-300 text-xs leading-snug">{caseData?.trigger_reason || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── RISK METRICS ─────────────────────────────────────────────── */}
      {caseData && currentStepIndex >= 5 && (
        <div className="p-5 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Risk Metrics</span>
          <div className={`rounded-xl border p-4 text-center mb-3 ${riskBg}`}>
            <span className="text-[11px] text-slate-400 block mb-1">Risk Score</span>
            <span className={`text-3xl font-black font-mono ${riskColor}`}>{risk.toFixed(2)}</span>
            <span className={`block text-xs font-bold mt-1 ${riskColor}`}>
              {risk >= 0.75 ? 'CRITICAL' : risk >= 0.40 ? 'HIGH' : risk >= 0.20 ? 'MEDIUM' : 'LOW'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Confidence</span>
              <span className="text-base font-bold font-mono text-emerald-400">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Uncertainty</span>
              <span className={`text-base font-bold font-mono ${uncertainty > 0.35 ? 'text-amber-400' : 'text-slate-300'}`}>
                {(uncertainty * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── INVESTIGATION PATH ───────────────────────────────────────── */}
      {caseData && (
        <div className="p-5 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Investigation Path</span>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
              isEvidenceSufficient ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-amber-950/30 border-amber-500/30'
            }`}>
              {isEvidenceSufficient
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <div>
                <span className={`text-xs font-bold block ${isEvidenceSufficient ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {isEvidenceSufficient ? 'Evidence Sufficient' : 'Step-Up Required'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isEvidenceSufficient ? 'Steps 07 & 08 skipped' : 'Steps 07 & 08 active'}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
              isApprovalRequired ? 'bg-amber-950/30 border-amber-500/30' : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              {isApprovalRequired
                ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              <div>
                <span className={`text-xs font-bold block ${isApprovalRequired ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {isApprovalRequired ? 'Analyst Approval' : 'Auto-Execution'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isApprovalRequired ? 'Step 11 active' : 'Step 11 skipped'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEXT BEST ACTION ─────────────────────────────────────────── */}
      {currentStepIndex >= 8 && nba?.action && (
        <div className="p-5 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Next Best Action</span>
          <div className={`p-3.5 rounded-xl border font-mono font-bold text-center text-sm ${
            nbaIsBlock   ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'    :
            nbaIsAllow   ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' :
            nbaIsMonitor ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' :
                           'bg-slate-900 border-slate-700 text-slate-200'
          }`}>
            {nba.action_display || nba.action}
          </div>
          {nba.reason && (
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{nba.reason}</p>
          )}
        </div>
      )}

      {/* ── TIMELINE ─────────────────────────────────────────────────── */}
      <div className="p-5 flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Progress</span>
        <div className="space-y-2.5">
          {milestones.map((m) => {
            const done    = currentStepIndex >= m.stepMin;
            const current = currentStepIndex === m.stepMin - 1;
            return (
              <div key={m.label} className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                ) : current ? (
                  <span className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </span>
                ) : (
                  <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                )}
                <span className={`text-xs ${done ? 'text-slate-300' : current ? 'text-cyan-300 font-semibold' : 'text-slate-600'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
