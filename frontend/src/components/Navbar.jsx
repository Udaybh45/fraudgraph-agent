import React from 'react';
import { ShieldCheck, Network, Database, Sparkles, AlertTriangle, Layers } from 'lucide-react';

export default function Navbar({ health, onOpenExplainability }) {
  return (
    <header className="glass-panel border-b border-slate-800/80 px-6 py-3.5 sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FraudGraph <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Agent</span>
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              HHGOA Edition
            </span>
          </div>
          <p className="text-xs text-slate-400">TigerGraph Agentic Fraud Investigation & Next-Best-Action</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* TigerGraph Engine Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">TigerGraph GSQL Engine:</span>
          <span className="font-semibold text-emerald-400">
            {health?.tigergraph_mode === 'LIVE_SAVANNA' ? 'Savanna Cloud' : 'High-Fidelity GSQL'}
          </span>
        </div>

        {/* Graph telemetry */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>{health?.total_vertices || 18} Vertices</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{health?.total_edges || 24} Edges</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{health?.total_historical_cases || 5} Prior Cases</span>
          </div>
        </div>

        {/* Explainability Button */}
        <button
          onClick={onOpenExplainability}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-semibold text-xs transition shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Explainability Matrix</span>
        </button>
      </div>
    </header>
  );
}
