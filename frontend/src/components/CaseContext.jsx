import React from 'react';
import { DollarSign, Shield, Clock, User, CreditCard, AlertTriangle, CheckCircle2, Circle, Activity } from 'lucide-react';

export default function CaseContext({ caseData, currentStepIndex }) {
  const txn = caseData?.transaction || {};
  const cust = caseData?.customer || {};
  const acc = caseData?.account || {};
  const dev = caseData?.device || {};
  const ip = caseData?.ip || {};
  const risk = caseData?.post_evidence_assessment?.risk_score ?? caseData?.risk_assessment?.risk_score ?? txn?.anomaly_score ?? 0.81;

  // Timeline milestones reflecting real backend stages
  const milestones = [
    { id: 'created', label: 'Case created', stepMin: 1 },
    { id: 'txn_loaded', label: 'Transaction loaded', stepMin: 2 },
    { id: 'graph_traversed', label: 'TigerGraph queried', stepMin: 3 },
    { id: 'device_checked', label: 'Device & IP analyzed', stepMin: 3 },
    { id: 'history_checked', label: 'Customer history verified', stepMin: 4 },
    { id: 'pattern_detected', label: 'Fraud pattern assessed', stepMin: 5 },
    { id: 'risk_assessed', label: 'Risk & uncertainty computed', stepMin: 6 },
    { id: 'step_up', label: 'Step-up challenge evaluated', stepMin: 8 },
    { id: 'nba_selected', label: 'Next Best Action selected', stepMin: 9 },
    { id: 'policy_checked', label: 'Policy & permission checked', stepMin: 10 },
    { id: 'resolved', label: 'Investigation resolved', stepMin: 13 },
    { id: 'memory_saved', label: 'Case memory updated', stepMin: 14 }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">RESOLVED</span>;
      case 'AWAITING_APPROVAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">AWAITING APPROVAL</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1"><Activity className="w-3 h-3 animate-spin" /> INVESTIGATING</span>;
    }
  };

  return (
    <aside className="space-y-4">
      {/* Persistent Case Metadata Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Case File</span>
            <span className="font-mono text-xs font-bold text-white tracking-wide">
              {caseData?.case_id || 'FR-PENDING'}
            </span>
          </div>
          {getStatusBadge(caseData?.status || 'INVESTIGATING')}
        </div>

        <div className="pt-3 space-y-2.5 text-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400">Trigger:</span>
            <span className="text-right text-slate-200 font-medium text-[11px] truncate max-w-[170px]" title={caseData?.trigger_reason}>
              {caseData?.trigger_reason || 'High-Risk Transaction'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transaction:</span>
            <span className="font-mono font-semibold text-cyan-400">{caseData?.transaction_id || txn?.id || 'TXN-1001'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Customer:</span>
            <span className="text-slate-200 font-medium truncate max-w-[150px]">{cust?.name || cust?.id || 'Marcus Vance'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account:</span>
            <span className="font-mono text-slate-300">{acc?.id || 'ACC-1001'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Amount:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ${Number(txn?.amount || 2850).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Timestamp:</span>
            <span className="font-mono text-slate-300 text-[11px]">{txn?.timestamp?.substring(0, 19).replace('T', ' ') || '2026-08-11 14:32'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Fraud Signal:</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
              risk >= 0.75 ? 'bg-rose-500/20 text-rose-400' :
              risk >= 0.40 ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {(risk).toFixed(2)} Risk
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Fraud Pattern:</span>
            <span className="font-semibold text-cyan-300 text-[11px] truncate max-w-[150px]" title={caseData?.fraud_pattern}>
              {currentStepIndex >= 4 ? (caseData?.fraud_pattern || 'Detected Pattern') : 'Pending Analysis'}
            </span>
          </div>
        </div>
      </div>

      {/* Case Timeline */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Case Timeline
          </span>
          <span className="text-[10px] font-mono text-slate-500">Live Audit</span>
        </div>

        <div className="space-y-2">
          {milestones.map((m) => {
            const isCompleted = currentStepIndex >= m.stepMin;
            const isCurrent = currentStepIndex === m.stepMin - 1;

            return (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-400/20 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={`text-[11px] leading-tight ${
                  isCompleted ? 'text-slate-200' : isCurrent ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                }`}>
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
