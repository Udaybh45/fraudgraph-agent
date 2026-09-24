import React, { useState } from 'react';
import { Bot, CheckCircle2, ChevronDown, ChevronRight, Terminal, AlertTriangle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function AgentDecisionPanel({
  caseData,
  currentStepIndex,
  skippedStepIndices = [],
  onGoToStep,
  onOpenExplainability,
  onApproveAction
}) {
  const [showTechnicalTrace, setShowTechnicalTrace] = useState(false);
  const [expandedTraceIdx, setExpandedTraceIdx] = useState(null);

  const nba = caseData?.next_best_action;
  const assessment = caseData?.post_evidence_assessment || caseData?.risk_assessment;
  const timeline = caseData?.timeline || [];

  // Dynamic status text corresponding to current stage
  const activityMap = {
    0: "Analyzing incoming transaction alert & initial signals...",
    1: "Opening fraud case record in TigerGraph schema...",
    2: "Querying TigerGraph multi-hop network & connected entities...",
    3: "Synthesizing supporting, contradicting, and missing evidence...",
    4: "Matching graph topological signatures to known fraud typologies...",
    5: "Evaluating 4-factor uncertainty model & decision defensibility...",
    6: "Dispatching out-of-band step-up authentication challenge...",
    7: "Reassessing risk with challenge outcome...",
    8: "Synthesizing defensible Next Best Action & policy limits...",
    9: "Validating action permissions & governance thresholds...",
    10: "Awaiting human fraud analyst authorization...",
    11: "Enforcing authorized action on transaction & account...",
    12: "Generating audit-ready case resolution summary...",
    13: "Indexing case outcome into TigerGraph case memory..."
  };

  const currentActivity = activityMap[currentStepIndex] || "Autonomous investigation active...";

  const agentChecklist = [
    { label: "Transaction retrieved", stepMin: 1 },
    { label: "TigerGraph entities traversed", stepMin: 3 },
    { label: "Customer baseline compared", stepMin: 4 },
    { label: "Fraud pattern identified", stepMin: 5 },
    { label: "4-Factor uncertainty assessed", stepMin: 6 },
    { label: "Policy limits validated", stepMin: 9 },
    { label: "Next Best Action selected", stepMin: 9 },
    { label: "Case memory updated", stepMin: 14 }
  ];

  return (
    <aside className="space-y-4">
      {/* Persistent Fraud Agent Status Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-200">Fraud Agent</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </div>
        </div>

        {/* Current Activity Box */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">Current Activity:</span>
          <p className="text-slate-200 text-[11px] leading-relaxed font-medium">
            {currentActivity}
          </p>
        </div>

        {/* Agent Investigation Checklist */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-semibold">Agent Checklist:</span>
          {agentChecklist.map((item, idx) => {
            const isDone = currentStepIndex >= item.stepMin;
            const isCurrent = currentStepIndex === item.stepMin - 1;

            return (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-3 h-3 rounded-full border border-purple-400 bg-purple-400/20 flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-ping" />
                  </span>
                ) : (
                  <span className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={isDone ? 'text-slate-300' : isCurrent ? 'text-purple-300 font-semibold' : 'text-slate-600'}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Recommendation Card (Stages 8+) */}
      {currentStepIndex >= 8 && nba && (
        <div className="bg-[#0f172a] border border-cyan-500/40 rounded-xl p-4 shadow-sm glow-cyan">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Agent Recommendation
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
              Policy-Gated
            </span>
          </div>

          <div className="mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Next Best Action</span>
            <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>{nba.action_display || nba.action}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-3 leading-relaxed">
              {nba.reason}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-slate-900 border border-slate-800/80 mb-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Confidence:</span>
              <span className="font-mono font-bold text-emerald-400">
                {((assessment?.confidence_score ?? 0.91) * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Uncertainty:</span>
              <span className="font-mono font-bold text-amber-400">
                {((assessment?.uncertainty_score ?? 0.09) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onGoToStep(3)} // Evidence step
              className="w-full py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center justify-between"
            >
              <span>Review Evidence</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={() => onGoToStep(9)} // Policy step
              className="w-full py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center justify-between"
            >
              <span>Review Policy</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={onOpenExplainability}
              className="w-full py-1.5 px-2 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-medium transition cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-purple-400" /> Explain Decision</span>
              <ArrowRight className="w-3 h-3 text-purple-400" />
            </button>
          </div>
        </div>
      )}

      {/* Conditional Investigation Path Card */}
      {caseData && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Investigation Path
          </span>
          <div className="space-y-1 text-[10px]">
            {[6, 7].every(i => skippedStepIndices.includes(i)) ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                <span>Steps 07–08 skipped (evidence sufficient)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                <span>Steps 07–08 required (uncertainty &gt; 35%)</span>
              </div>
            )}
            {skippedStepIndices.includes(10) ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                <span>Step 11 skipped (auto-execution enabled)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                <span>Step 11 required (human approval needed)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Investigation Trace */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <button
          onClick={() => setShowTechnicalTrace(!showTechnicalTrace)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Investigation Trace
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {showTechnicalTrace ? 'Hide Trace' : `Show (${timeline.length} ops)`}
          </span>
        </button>

        {showTechnicalTrace && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 max-h-72 overflow-y-auto pr-1">
            {timeline.length > 0 ? (
              timeline.map((item, idx) => {
                const isExpanded = expandedTraceIdx === idx;
                return (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                    <div
                      onClick={() => setExpandedTraceIdx(isExpanded ? null : idx)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-mono text-cyan-400 font-bold text-[10px]">{item.step}</span>
                      <span className="text-[9px] font-mono text-slate-400">{item.timestamp?.substring(11, 19)}</span>
                    </div>
                    <p className="text-slate-300 text-[10px] mt-0.5">{item.description}</p>
                    {isExpanded && item.data && (
                      <pre className="mt-1.5 p-1.5 rounded bg-black/60 text-[9px] font-mono text-slate-400 overflow-x-auto max-h-32 border border-slate-800">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-500 italic">No agent operations logged yet.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
