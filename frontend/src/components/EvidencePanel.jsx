import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, FileSearch, CheckCircle2, XCircle } from 'lucide-react';

export default function EvidencePanel({ assessment, additionalRequested, additionalResult }) {
  if (!assessment) return null;

  const supporting = assessment.supporting_evidence || [];
  const contradicting = assessment.contradicting_evidence || [];
  const missing = assessment.missing_evidence || [];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Evidence Matrix & Defensibility
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {supporting.length + contradicting.length} Verified Evidence Items
        </span>
      </div>

      {/* Step-Up Authentication Status Pill */}
      {additionalRequested && (
        <div className="mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${additionalResult === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {additionalResult === 'PASSED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[11px] font-bold text-white block">Step-Up MFA / Biometric Challenge</span>
              <span className="text-[10px] text-slate-400">Dispatched via Out-of-band Authenticator</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
            additionalResult === 'PASSED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            RESULT: {additionalResult || 'PENDING'}
          </span>
        </div>
      )}

      {/* Supporting Evidence */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-400">
            Supporting Fraud Evidence ({supporting.length})
          </span>
        </div>
        <div className="space-y-1.5">
          {supporting.length > 0 ? (
            supporting.map((ev, i) => (
              <div
                key={i}
                className="glass-card rounded-lg p-2.5 border border-rose-950/40 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="text-slate-200 font-medium text-[11px] leading-snug">{ev.description}</p>
                  <span className="text-[9px] font-mono text-slate-500 uppercase mt-0.5 block">
                    Source: {ev.source_tool || 'Graph Traversal'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400 shrink-0">
                  +{(Number(ev.confidence_weight || 0.8) * 100).toFixed(0)}%
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No direct fraud indicators detected.</p>
          )}
        </div>
      </div>

      {/* Contradicting Evidence */}
      {contradicting.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              Contradicting (Benign) Evidence ({contradicting.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {contradicting.map((ev, i) => (
              <div
                key={i}
                className="glass-card rounded-lg p-2.5 border border-emerald-950/40 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="text-slate-200 font-medium text-[11px] leading-snug">{ev.description}</p>
                  <span className="text-[9px] font-mono text-slate-500 uppercase mt-0.5 block">
                    Source: {ev.source_tool || 'Verification'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                  -{(Number(ev.confidence_weight || 0.8) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Evidence Checklist */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">
            Missing Evidence Checklist ({missing.length})
          </span>
        </div>
        <div className="space-y-1">
          {missing.length > 0 ? (
            missing.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">All primary checklist items verified.</p>
          )}
        </div>
      </div>
    </div>
  );
}
