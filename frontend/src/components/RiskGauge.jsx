import React from 'react';
import { AlertTriangle, CheckCircle, Shield, Gauge, HelpCircle, Activity } from 'lucide-react';

export default function RiskGauge({ assessment, initialAssessment }) {
  if (!assessment) return null;

  const riskScore = assessment?.risk_score ?? 0.5;
  const confidenceScore = assessment?.confidence_score ?? 0.5;
  const uncertaintyScore = assessment?.uncertainty_score ?? 0.5;
  const riskLevel = assessment?.risk_level ?? "MEDIUM";
  const breakdown = assessment?.breakdown || {
    graph_support_pct: 75,
    historical_support_pct: 60,
    signal_strength_pct: 80,
    evidence_coverage_pct: 75
  };

  const getRiskColors = (lvl) => {
    switch (lvl) {
      case 'CRITICAL':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', fill: '#f43f5e' };
      case 'HIGH':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', fill: '#f59e0b' };
      case 'MEDIUM':
        return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', fill: '#eab308' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', fill: '#10b981' };
    }
  };

  const colors = getRiskColors(riskLevel);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Uncertainty & Risk Assessment
          </h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
          {riskLevel} RISK ({riskScore.toFixed(2)})
        </span>
      </div>

      {/* Main Scores Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass-card rounded-xl p-3 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Risk Score</span>
          <div className={`text-2xl font-mono font-extrabold ${colors.text}`}>
            {riskScore.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">0.00 (Safe) - 1.00 (Fraud)</span>
        </div>

        <div className="glass-card rounded-xl p-3 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Confidence</span>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            {(confidenceScore * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-500">Defensibility Threshold: 70%</span>
        </div>

        <div className="glass-card rounded-xl p-3 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Uncertainty</span>
          <div className={`text-2xl font-mono font-extrabold ${uncertaintyScore > 0.35 ? 'text-amber-400' : 'text-slate-300'}`}>
            {(uncertaintyScore * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-500">
            {uncertaintyScore > 0.35 ? 'MFA Verification Mandated' : 'Defensible Decision'}
          </span>
        </div>
      </div>

      {/* 4-Factor Confidence Decomposition */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 font-semibold text-[11px]">4-Factor Uncertainty Decomposition</span>
          <span className="text-[10px] font-mono text-cyan-400">TigerGraph HHGOA Formula</span>
        </div>

        {/* 1. Graph Support (35%) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Graph Support (Weight: 35%)</span>
            <span className="font-mono text-cyan-400">{breakdown.graph_support_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.graph_support_pct}%` }}
            />
          </div>
        </div>

        {/* 2. Historical Case Rate (25%) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Historical Case Prior (Weight: 25%)</span>
            <span className="font-mono text-indigo-400">{breakdown.historical_support_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.historical_support_pct}%` }}
            />
          </div>
        </div>

        {/* 3. Signal Strength (25%) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Anomaly Signal Strength (Weight: 25%)</span>
            <span className="font-mono text-amber-400">{breakdown.signal_strength_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.signal_strength_pct}%` }}
            />
          </div>
        </div>

        {/* 4. Evidence Coverage (15%) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Evidence Coverage Checklist (Weight: 15%)</span>
            <span className="font-mono text-emerald-400">{breakdown.evidence_coverage_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.evidence_coverage_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
