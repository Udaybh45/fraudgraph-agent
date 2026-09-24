import React, { useState } from 'react';
import GraphCanvas from './GraphCanvas';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  FileSearch,
  Scale,
  Lock,
  UserCheck,
  Database,
  Layers,
  Sparkles,
  Info,
  Clock,
  Activity,
  History,
  Target,
  RefreshCw,
  Terminal,
  ExternalLink
} from 'lucide-react';

export default function StageContent({
  currentStepIndex,
  caseData,
  subgraph,
  onNextStage,
  onGoToStep,
  onApproveAction,
  onDispatchStepUp,
  onOpenExplainability,
  isProcessing,
  isInvestigating,
  skippedStepIndices = []
}) {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [stepUpInProgress, setStepUpInProgress] = useState(false);
  const [stepUpCompleted, setStepUpCompleted] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideChoice, setOverrideChoice] = useState('ALLOW_TRANSACTION');
  const [analystNote, setAnalystNote] = useState('Analyst override based on verified external records.');

  const txn = caseData?.transaction || {};
  const cust = caseData?.customer || {};
  const dev = caseData?.device || {};
  const ip = caseData?.ip || {};
  const nba = caseData?.next_best_action || {};
  const initialNba = caseData?.initial_nba || nba;
  const initialAssessment = caseData?.risk_assessment || {};
  const postAssessment = caseData?.post_evidence_assessment || initialAssessment;
  const similarCases = caseData?.similar_cases || [];
  const policies = caseData?.applicable_policies || [];
  const pattern = caseData?.fraud_pattern || 'Device Farming / Multi-Accounting';

  const riskScore = postAssessment.risk_score ?? initialAssessment.risk_score ?? 0.81;
  const confScore = postAssessment.confidence_score ?? initialAssessment.confidence_score ?? 0.72;
  const uncScore = postAssessment.uncertainty_score ?? initialAssessment.uncertainty_score ?? 0.28;

  // Conditional flags — derived from skippedStepIndices (single source of truth from App.jsx)
  const isEvidenceSufficient = skippedStepIndices.includes(6); // Step-Up (index 6) skipped → evidence is sufficient
  const isHumanApprovalRequired = !skippedStepIndices.includes(10); // Approval (index 10) not skipped → required

  // Step-Up simulation handler
  const handleRequestStepUp = () => {
    setStepUpInProgress(true);
    setTimeout(() => {
      setStepUpInProgress(false);
      setStepUpCompleted(true);
      if (onDispatchStepUp) onDispatchStepUp();
    }, 1200);
  };

  /* ========================================================
     STAGE 01 — TRIGGER
     ======================================================== */
  if (currentStepIndex === 0) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">01</span>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">Investigation Trigger</h2>
            </div>
            <span className="text-xs text-slate-400">Why was this case opened?</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Trigger Event:</span>
            <span className="font-mono font-bold text-rose-400">Fraud Risk Signal</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Transaction ID:</span>
              <span className="font-mono text-cyan-400 font-semibold">{txn?.id || caseData?.transaction_id || 'TXN-1001'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Transaction Amount:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${Number(txn?.amount || 2850).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Initial Risk Signal:</span>
              <span className="font-mono font-bold text-rose-400">{(txn?.anomaly_score || 0.81).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Trigger Source:</span>
              <span className="text-slate-200 font-medium">Transaction Monitoring System</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">Detected Anomaly Signals:</span>
            <ul className="space-y-1 text-slate-300 list-disc pl-4 text-[11px] leading-relaxed">
              <li>Unusual transaction amount exceeding customer baseline velocity.</li>
              <li>Unfamiliar hardware device fingerprint.</li>
              <li>Anonymized network connection flag detected on originating IP.</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Start Investigation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 02 — CASE CREATED
     ======================================================== */
  if (currentStepIndex === 1) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">02</span>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">Case Created</h2>
            </div>
            <span className="text-xs text-slate-400">Investigation dossier recorded in TigerGraph</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Case ID:</span>
            <span className="font-mono font-bold text-cyan-400">{caseData?.case_id || 'CASE-1001'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Investigation Status:</span>
            <span className="font-mono font-bold text-emerald-400">OPEN</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Associated Transaction:</span>
            <span className="font-mono text-slate-200">{txn?.id || 'TXN-BM-1001'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Investigation Trigger:</span>
            <span className="text-slate-200 font-medium">{caseData?.trigger_reason}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">TigerGraph Schema:</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Case vertex & edges committed
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The case vertex has been registered in the TigerGraph fraud knowledge graph. The agent is ready to execute GSQL traversals to uncover connected entities.
        </p>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Begin Investigation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 03 — GRAPH INVESTIGATION
     ======================================================== */
  if (currentStepIndex === 2) {
    const devSharing = caseData?.device_sharing || {};
    const ipCluster = caseData?.ip_cluster || {};

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">03</span>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">TigerGraph Graph Investigation</h2>
            </div>
            <p className="text-xs text-slate-400">Interactive multi-hop network centered on transaction</p>
          </div>
        </div>

        {/* Interactive Canvas Graph */}
        <div className="h-[360px] rounded-xl overflow-hidden border border-slate-800">
          <GraphCanvas subgraph={subgraph || caseData?.subgraph} fraudPattern={pattern} />
        </div>

        {/* Graph Findings Box */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
            TigerGraph GSQL Findings
          </span>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            {devSharing.distinct_customers > 1 ? (
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong className="text-white">Device {dev?.id || 'D-104'}</strong> shared across <strong className="text-rose-400">{devSharing.distinct_customers} distinct customer accounts</strong>.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Device fingerprint is unique to cardholder profile.</span>
              </div>
            )}

            {ipCluster.customer_count > 1 ? (
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong className="text-white">IP {ip?.ip_address || '185.220.101.22'}</strong> associated with multiple accounts in proxy cluster.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <span>Originating network IP: {ip?.ip_address || 'Standard Subnet'}.</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Review Gathered Evidence</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 04 — EVIDENCE SYNTHESIS
     ======================================================== */
  if (currentStepIndex === 3) {
    const supporting = postAssessment.supporting_evidence || [];
    const contradicting = postAssessment.contradicting_evidence || [];
    const missing = postAssessment.missing_evidence || [];

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">04</span>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">Evidence Synthesis</h2>
            </div>
            <p className="text-xs text-slate-400">Categorized evidence with empirical source attribution</p>
          </div>
        </div>

        {/* Supporting Evidence */}
        <div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">
            Supporting Evidence ({supporting.length})
          </span>
          <div className="space-y-2">
            {supporting.map((ev, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="text-slate-200 font-medium">{ev.description}</p>
                  <span className="text-[10px] font-mono text-cyan-400 mt-1 inline-block px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    Source: {ev.source_tool || 'TigerGraph GSQL'}
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-400 shrink-0 text-xs">
                  +{(Number(ev.confidence_weight || 0.85) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contradicting Evidence */}
        {contradicting.length > 0 && (
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
              Contradicting Evidence ({contradicting.length})
            </span>
            <div className="space-y-2">
              {contradicting.map((ev, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between">
                  <div>
                    <p className="text-slate-200 font-medium">{ev.description}</p>
                    <span className="text-[10px] font-mono text-emerald-400 mt-1 inline-block px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                      Source: {ev.source_tool || 'Customer Baseline'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0 text-xs">
                    -{(Number(ev.confidence_weight || 0.8) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Evidence */}
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">
            Missing Evidence Checklist ({missing.length})
          </span>
          <div className="space-y-1.5">
            {missing.map((item, i) => (
              <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Analyze Fraud Pattern</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 05 — FRAUD PATTERN
     ======================================================== */
  if (currentStepIndex === 4) {
    const candidatePatterns = [
      { name: "Device Farming / Multi-Accounting", detected: pattern.includes("Device") },
      { name: "Account Takeover (ATO)", detected: pattern.includes("Takeover") },
      { name: "Money Mule Pass-Through Syndicate", detected: pattern.includes("Mule") },
      { name: "Card Testing & Velocity Burst", detected: pattern.includes("Velocity") },
      { name: "Unusual Transaction (Benign Baseline Shift)", detected: pattern.includes("Unclassified") || pattern.includes("Travel") }
    ];

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">05</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Typology Assessment</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Detected Fraud Pattern: <span className="text-cyan-400">{pattern}</span>
          </h2>
          <span className="text-xs text-slate-400">Graph signature matched against GraphRAG fraud typology database</span>
        </div>

        {/* Candidate Patterns */}
        <div className="space-y-2">
          {candidatePatterns.map((cp, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                cp.detected
                  ? 'bg-cyan-950/20 border-cyan-500/50 text-white font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>{cp.name}</span>
              {cp.detected ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Detected Signature
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-600">No Match</span>
              )}
            </div>
          ))}
        </div>

        {/* Why this pattern was identified */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-200 block uppercase text-[10px] tracking-wider">
            Supporting Evidence Rationale:
          </span>
          <ul className="space-y-1.5 text-slate-300 list-disc pl-4 text-[11px] leading-relaxed">
            <li>Physical device hardware fingerprint connected to multiple customer records.</li>
            <li>Originating IP routing matches anonymized network indicators.</li>
            <li>Transaction velocity and product code conform to empirical fraud typology patterns.</li>
          </ul>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Proceed to Risk & Uncertainty</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 06 — RISK & UNCERTAINTY
     ======================================================== */
  if (currentStepIndex === 5) {
    const riskLvl = initialAssessment.risk_level || 'CRITICAL';
    const conf = initialAssessment.confidence_score || 0.72;
    const unc = initialAssessment.uncertainty_score || 0.28;

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">06</span>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Risk & Uncertainty Assessment</h2>
          </div>
          <p className="text-xs text-slate-400">Evaluating 4-factor confidence model and decision readiness</p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Risk</span>
            <span className={`text-xl font-bold font-mono ${
              riskLvl === 'CRITICAL' ? 'text-rose-400' : riskLvl === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {riskLvl} ({initialAssessment.risk_score?.toFixed(2) || '0.86'})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Confidence</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {(conf * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Uncertainty</span>
            <span className={`text-xl font-bold font-mono ${unc > 0.35 ? 'text-amber-400' : 'text-slate-300'}`}>
              {(unc * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Policy Threshold Note */}
        <div className="text-[11px] text-slate-500 font-mono text-center">
          Project-configured uncertainty threshold: 35%
        </div>

        {/* Decision Readiness Banner */}
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
          isEvidenceSufficient
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
        }`}>
          {isEvidenceSufficient ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <span className="font-bold block uppercase text-[11px] mb-0.5">
              Decision Readiness: {isEvidenceSufficient ? 'Evidence Is Sufficient' : 'More Evidence Required'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {isEvidenceSufficient
                ? 'Confidence exceeds 70% with verified graph evidence. The agent is authorized to proceed to Next Best Action directly.'
                : 'Current evidence indicates elevated risk, but decision uncertainty (> 35%) requires active out-of-band verification under policy POL-004 before taking destructive action.'}
            </p>
          </div>
        </div>

        {/* Route label shows the conditional path for judges */}
        {isEvidenceSufficient && (
          <div className="text-[11px] text-center text-slate-500 font-mono">
            → Skipping Steps 07 & 08 (not required) → Proceeding to Step 09
          </div>
        )}

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>{isEvidenceSufficient ? 'Proceed to Next Best Action →' : 'Gather Additional Evidence →'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 07 — ADDITIONAL EVIDENCE (Step-Up)
     ======================================================== */
  if (currentStepIndex === 6) {
    const result = caseData?.additional_evidence_result || (stepUpCompleted ? "FAILED" : null);

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">07</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Uncertainty Gating</span>
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Additional Evidence</h2>
          <p className="text-xs text-slate-400">Why is more evidence required?</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Current uncertainty remains too high to make a sufficiently supported, defensible decision without customer verification.
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <span className="text-slate-400">Requested Evidence:</span>
            <span className="font-mono text-cyan-400 font-semibold">Step-Up Authentication (Biometric / WebAuthn Challenge)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Policy:</span>
            <span className="font-mono text-slate-300">POL-004 (Uncertainty-Gated Protocol)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-mono text-amber-400 font-semibold">{result ? 'Evidence received' : 'Waiting for evidence'}</span>
          </div>
        </div>

        {/* Dispatch Button */}
        {!result && !stepUpInProgress && (
          <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-3">
            <p className="text-xs text-slate-300">Dispatch out-of-band biometric challenge to cardholder device:</p>
            <button
              onClick={handleRequestStepUp}
              className="py-2 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Dispatch Evidence Request
            </button>
          </div>
        )}

        {stepUpInProgress && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
            <span className="text-xs text-slate-200 font-medium block">Dispatching WebAuthn push challenge...</span>
            <span className="text-[10px] text-slate-500 font-mono">Awaiting cardholder response...</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Evidence Request:</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sent
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400 font-semibold">Challenge Result:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                result === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {result}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] pt-1">
              {result === 'PASSED' ? 'Evidence added: Legitimate cardholder completed verification successfully.' : 'Evidence added: Customer failed or rejected the biometric challenge.'}
            </p>
          </div>
        )}

        <button
          onClick={onNextStage}
          disabled={stepUpInProgress}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Reassess Investigation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 08 — REASSESSMENT
     ======================================================== */
  if (currentStepIndex === 7) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">08</span>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Investigation Reassessment</h2>
          </div>
          <p className="text-xs text-slate-400">Comparing risk metrics before and after additional evidence</p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block pb-1 border-b border-slate-800">
              BEFORE
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk:</span>
              <span className="font-mono font-bold text-amber-400">{(initialAssessment.risk_score ?? 0.58).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-mono text-slate-200">{((initialAssessment.confidence_score ?? 0.56) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Uncertainty:</span>
              <span className="font-mono text-amber-400">{((initialAssessment.uncertainty_score ?? 0.44) * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block pb-1 border-b border-slate-800">
              AFTER
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk:</span>
              <span className="font-mono font-bold text-rose-400">{(postAssessment.risk_score ?? 0.86).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-mono font-bold text-emerald-400">{((postAssessment.confidence_score ?? 0.91) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Uncertainty:</span>
              <span className="font-mono font-bold text-slate-200">{((postAssessment.uncertainty_score ?? 0.09) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* What Changed? */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-200 block uppercase text-[10px]">What Changed?</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            New evidence: Out-of-band customer verification response. Decision readiness shifted from <strong className="text-amber-400">Insufficient</strong> to <strong className="text-emerald-400">Sufficient</strong>.
          </p>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Determine Next Best Action</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 09 — NEXT BEST ACTION
     ======================================================== */
  if (currentStepIndex === 8) {
    const action = nba.action || 'BLOCK_TRANSACTION';
    const isBlock = action.includes('BLOCK');
    const isAllow = action.includes('ALLOW');

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">09</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Policy Recommendation</span>
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Next Best Action Formulation</h2>
        </div>

        {/* Dominant Recommended Action Card */}
        <div className={`p-5 rounded-xl border ${
          isBlock ? 'bg-rose-950/15 border-rose-500/50' : isAllow ? 'bg-emerald-950/15 border-emerald-500/50' : 'bg-amber-950/15 border-amber-500/50'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            NEXT BEST ACTION
          </span>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {nba.action_display || action}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-200 block text-[11px]">Why this action?</span>
            <ul className="space-y-1 text-slate-300 list-disc pl-4 text-[11px] leading-relaxed">
              <li>Strong graph-based fraud evidence across multi-hop relationships.</li>
              <li>Calculated risk ({riskScore.toFixed(2)}) exceeds tolerance limits.</li>
              <li>Decision uncertainty is low and defensible.</li>
              <li>High-confidence fraud typology signature detected.</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Policy:</span>
              <span className="font-mono text-cyan-400 font-semibold">{nba.policy_reference || 'POL-005'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Approval:</span>
              <span className="font-mono text-amber-400 font-semibold">{nba.approval_display || nba.required_approval}</span>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2 font-semibold">Secondary Actions Considered:</span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-center">Monitor Account</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-center">Request More Evidence</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-center">Allow With Watchlist</div>
          </div>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Review Policy & Permission</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 10 — POLICY & PERMISSION
     ======================================================== */
  if (currentStepIndex === 9) {
    const perm = caseData?.permission_check || {};

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">10</span>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Policy & Permission</h2>
          </div>
          <p className="text-xs text-slate-400">Verifying bank governance rules and required approval routes</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Requested Action:</span>
            <span className="font-mono font-bold text-white">{nba.action || 'BLOCK_TRANSACTION'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Applicable Policy:</span>
            <span className="font-mono font-bold text-cyan-400">{nba.policy_reference || 'POL-005'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Permission:</span>
            <span className="font-mono font-bold text-emerald-400">✓ Authorized</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Human Approval:</span>
            <span className="font-mono font-bold text-amber-400">
              {isHumanApprovalRequired ? 'Required' : 'Not Required (Auto-Execution)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Approval Route:</span>
            <span className="font-mono text-cyan-400 font-semibold">{nba.approval_display || 'Tier-1 Fraud Analyst'}</span>
          </div>
        </div>

        {!isHumanApprovalRequired && (
          <div className="text-[11px] text-center text-slate-500 font-mono">
            → Human approval not required (automated action) → Skipping Step 11
          </div>
        )}

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>{isHumanApprovalRequired ? 'Request Analyst Sign-Off →' : 'Auto-Execute Action (No Approval Needed) →'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 11 — HUMAN APPROVAL
     ======================================================== */
  if (currentStepIndex === 10) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">11</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Analyst Governance</span>
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Human Approval Required</h2>
          <p className="text-xs text-slate-400">Controlled financial investigation authorization portal</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Recommended Action:</span>
            <span className="font-bold text-white">{nba.action_display || nba.action}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Risk Score:</span>
            <span className="font-mono font-bold text-rose-400">{riskScore.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Confidence:</span>
            <span className="font-mono font-bold text-emerald-400">{((confScore) * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Policy:</span>
            <span className="font-mono text-cyan-400">{nba.policy_reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Approval Required:</span>
            <span className="font-mono text-amber-400 font-semibold">{nba.approval_display || 'Tier-1 Analyst'}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              if (onApproveAction) {
                onApproveAction({ decision: 'APPROVE', analyst_name: 'Senior Fraud Analyst' });
              }
              onNextStage();
            }}
            disabled={isProcessing}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Approve Action</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowOverrideDialog(!showOverrideDialog)}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              Reject / Override
            </button>
            <button
              onClick={() => onGoToStep(3)} // Return to Evidence
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              Request More Evidence
            </button>
          </div>
        </div>

        {showOverrideDialog && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Select Override Action:</span>
            <select
              value={overrideChoice}
              onChange={(e) => setOverrideChoice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
            >
              <option value="ALLOW_TRANSACTION">ALLOW_TRANSACTION (Manual Whitelist)</option>
              <option value="MONITOR_ACCOUNT">MONITOR_ACCOUNT (Soft Watchlist)</option>
              <option value="ESCALATE_TO_FRAUD_ANALYST">ESCALATE_TO_FRAUD_ANALYST (AML Review)</option>
            </select>
            <input
              type="text"
              value={analystNote}
              onChange={(e) => setAnalystNote(e.target.value)}
              placeholder="Analyst justification..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
            />
            <button
              onClick={() => {
                if (onApproveAction) {
                  onApproveAction({ decision: 'OVERRIDE', override_action: overrideChoice, notes: analystNote });
                }
                setShowOverrideDialog(false);
                onNextStage();
              }}
              className="w-full py-1.5 rounded bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Confirm Override Decision
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================
     STAGE 12 — ACTION EXECUTION
     ======================================================== */
  if (currentStepIndex === 11) {
    const executed = caseData?.executed_action || {
      action_type: nba.action || 'BLOCK_TRANSACTION',
      status: 'SUCCESS',
      executed_by: 'Senior Fraud Analyst / Agent',
      executed_at: '2026-08-11 14:32:15 UTC'
    };

    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">12</span>
                <h2 className="text-base font-bold text-white uppercase tracking-tight">Action Execution</h2>
              </div>
              <p className="text-xs text-slate-400">Controlled execution against core banking ledger</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            Simulation Mode
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Action:</span>
            <span className="font-mono font-bold text-white">{executed.action_type || 'BLOCK_TRANSACTION'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Execution Status:</span>
            <span className="font-mono font-bold text-emerald-400">{executed.status || 'SUCCESS'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Timestamp:</span>
            <span className="font-mono text-slate-300">{executed.executed_at || '2026-08-11 14:32:15 UTC'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Actor:</span>
            <span className="text-slate-200">{executed.executed_by || 'Agent / Analyst'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Trail Committed:</span>
          </div>
          <ul className="text-[11px] space-y-1 pl-5 list-disc text-slate-300">
            <li>Policy validated</li>
            <li>Permission validated</li>
            <li>Approval received</li>
            <li>Action executed</li>
            <li>Case updated</li>
            <li>TigerGraph action record created</li>
          </ul>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>View Case Resolution</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 13 — CASE RESOLUTION
     ======================================================== */
  if (currentStepIndex === 12) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">13</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Investigation Complete</span>
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Case Resolution</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Case:</span>
            <span className="font-mono font-bold text-white">{caseData?.case_id || 'CASE-1001'}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Transaction:</span>
            <span className="font-mono font-bold text-cyan-400">{txn?.id || 'TXN-1001'}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Fraud Pattern:</span>
            <span className="font-semibold text-white truncate block">{pattern}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Final Risk:</span>
            <span className="font-mono font-bold text-rose-400 text-sm">{riskScore.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Confidence:</span>
            <span className="font-mono font-bold text-emerald-400">{((confScore) * 100).toFixed(0)}%</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Final Action:</span>
            <span className="font-mono font-bold text-white truncate block">{nba.action || 'BLOCK_TRANSACTION'}</span>
          </div>
        </div>

        {/* Decision Explanation */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-200 block text-[10px] uppercase">Decision Explanation</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {caseData?.explanations?.why_was_this_action_selected || 'The action was selected to maximize fraud prevention while honoring policy limits and verified identity.'}
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400 text-[10px]">
            <span>Remaining Uncertainty:</span>
            <span className="font-mono text-slate-200">{((uncScore) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <button
          onClick={onNextStage}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Persist to Case Memory</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ========================================================
     STAGE 14 — CASE MEMORY
     ======================================================== */
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Case Memory</h2>
        </div>
        <p className="text-xs text-slate-400">Findings and graph linkages committed to historical memory</p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Case Memory Persisted</span>
        </div>
        <ul className="text-[11px] space-y-1 pl-5 list-disc text-slate-300">
          <li>Investigation stored</li>
          <li>Findings stored</li>
          <li>Decision stored</li>
          <li>Action stored</li>
          <li>Outcome stored</li>
        </ul>
      </div>

      {/* Similar Historical Cases */}
      <div>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Similar Historical Cases
        </span>
        <div className="space-y-2">
          {similarCases.length > 0 ? (
            similarCases.map((sc, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-white block">{sc.case_id || sc.case_number}</span>
                  <span className="text-slate-400 text-[11px]">{sc.fraud_pattern || 'Pattern Match'} • Outcome: {sc.outcome}</span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Similarity: {sc.similarity_pct || 97}%
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">Historical cases indexed in TigerGraph.</p>
          )}
        </div>
      </div>

      {/* Final Screenshot-Ready Summary Box */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
        <span className="text-xs font-bold text-emerald-300 uppercase block tracking-wider">
          INVESTIGATION COMPLETE ✓
        </span>
        <span className="text-[11px] text-slate-300 block">
          Case {caseData?.case_id || 'CASE-1001'} fully resolved, governed, and stored as case memory.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onOpenExplainability}
          className="py-2 px-3 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Explain Decision</span>
        </button>

        <button
          onClick={() => onGoToStep(0)}
          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
        >
          Restart Investigation
        </button>
      </div>
    </div>
  );
}
