import React, { useState } from 'react';
import { Target, CheckCircle2, ShieldAlert, ArrowRight, UserCheck, AlertOctagon, RefreshCw } from 'lucide-react';

export default function NextBestActionCard({
  nba,
  caseId,
  approvalStatus,
  executedAction,
  onApproveAction,
  isProcessing
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideAction, setOverrideAction] = useState('ALLOW_TRANSACTION');
  const [analystNotes, setAnalystNotes] = useState('Reviewed multi-hop graph and verified customer identity.');

  if (!nba) return null;

  const action = nba.action || 'MONITOR_ACCOUNT';
  const isBlock = action.includes('BLOCK');
  const isEscalate = action.includes('ESCALATE');
  const isAllow = action.includes('ALLOW');

  const getCardBorder = () => {
    if (isBlock) return 'border-rose-500/50 glow-rose bg-rose-950/10';
    if (isEscalate) return 'border-purple-500/50 bg-purple-950/10';
    if (isAllow) return 'border-emerald-500/50 glow-emerald bg-emerald-950/10';
    return 'border-amber-500/50 bg-amber-950/10';
  };

  const handleApprove = () => {
    onApproveAction({
      decision: 'APPROVE',
      analyst_name: 'Senior Fraud Operations Analyst',
      notes: analystNotes
    });
  };

  const handleOverride = () => {
    onApproveAction({
      decision: 'OVERRIDE',
      override_action: overrideAction,
      analyst_name: 'Senior Fraud Operations Analyst',
      notes: analystNotes
    });
    setShowOverride(false);
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border ${getCardBorder()} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200">
            Recommended Next Best Action (NBA)
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          Policy Gated
        </span>
      </div>

      {/* Action Title & Display */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-white tracking-tight">
            {nba.action_display || action}
          </span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
            isBlock ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
            isEscalate ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
            isAllow ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
            'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {action}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {nba.reason}
        </p>
      </div>

      {/* Governance & Policy Meta */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs mb-4">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Governing Policy</span>
          <span className="font-semibold text-cyan-400 text-[11px] truncate block">
            {nba.policy_reference || 'POL-001 (Standard)'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Required Approval Tier</span>
          <span className="font-semibold text-amber-400 text-[11px] truncate block">
            {nba.approval_display || nba.required_approval}
          </span>
        </div>
      </div>

      {/* Execution Controls */}
      {executedAction ? (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Action Executed & Enforced</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {executedAction.executed_at} by {executedAction.executed_by}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {executedAction.status}
          </span>
        </div>
      ) : (
        <div>
          {nba.is_sensitive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Approve & Execute Action</span>
                </button>
                <button
                  onClick={() => setShowOverride(!showOverride)}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Override
                </button>
              </div>

              {showOverride && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-300 block">Analyst Override Decision</span>
                  <select
                    value={overrideAction}
                    onChange={(e) => setOverrideAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                  >
                    <option value="ALLOW_TRANSACTION">ALLOW_TRANSACTION (Manual Whitelist)</option>
                    <option value="MONITOR_ACCOUNT">MONITOR_ACCOUNT (Soft Watchlist)</option>
                    <option value="BLOCK_TRANSACTION">BLOCK_TRANSACTION (Force Block)</option>
                    <option value="ESCALATE_TO_FRAUD_ANALYST">ESCALATE_TO_FRAUD_ANALYST (AML Review)</option>
                  </select>
                  <input
                    type="text"
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                    placeholder="Analyst rationale / justification..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                  />
                  <button
                    onClick={handleOverride}
                    className="w-full py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                  >
                    Confirm Override
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              <span className="text-[11px]">Action automated under policy authority.</span>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] transition cursor-pointer"
              >
                Re-enact
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
