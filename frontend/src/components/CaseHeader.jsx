import React from 'react';
import { Clock, DollarSign, User, ShieldCheck, Activity, Terminal, CheckCircle2 } from 'lucide-react';

export default function CaseHeader({ caseData, isInvestigating }) {
  if (!caseData && !isInvestigating) return null;

  const txn = caseData?.transaction || {};
  const cust = caseData?.customer || {};
  const status = caseData?.status || (isInvestigating ? "INVESTIGATING" : "IDLE");

  const getStatusBadge = (st) => {
    switch (st) {
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
      case 'AWAITING_APPROVAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 animate-pulse" /> Awaiting Human Approval</span>;
      case 'INVESTIGATING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 animate-spin" /> Active Graph Traversal</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">{st}</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-slate-400">CASE ID:</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{caseData?.case_id || 'INITIALIZING...'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">TXN:</span>
            <span className="text-sm font-mono text-slate-200">{caseData?.transaction_id || txn?.id}</span>
            {getStatusBadge(status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-400/90 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded">
              Trigger
            </span>
            <p className="text-sm font-medium text-slate-200">
              {caseData?.trigger_reason || "Incoming Fraud Alert"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Transaction Amount</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                ${Number(txn?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Cardholder Identity</span>
              <span className="text-sm font-semibold text-white">
                {cust?.name || "Verified Customer"}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Investigation Latency</span>
              <span className="text-sm font-mono font-semibold text-slate-200">
                {caseData?.total_execution_ms || 12} ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
