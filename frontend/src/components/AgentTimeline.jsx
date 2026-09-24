import React, { useState } from 'react';
import { GitBranch, ChevronDown, ChevronRight, CheckCircle2, Clock, Terminal } from 'lucide-react';

export default function AgentTimeline({ timeline }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const steps = timeline || [];

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Autonomous Agent Investigation Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          {steps.length} Steps Executed
        </span>
      </div>

      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {steps.map((st, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div key={i} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500/80 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              <div className="glass-card rounded-xl p-3 border border-slate-800/80 hover:border-slate-700 transition">
                <div
                  onClick={() => toggleExpand(i)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                      {st.step}
                    </span>
                    <p className="text-xs font-medium text-slate-200">{st.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[9px] font-mono">{st.timestamp?.substring(11, 19)}</span>
                    {st.data && (
                      isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Expanded data view */}
                {isExpanded && st.data && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800">
                    <pre className="text-[10px] font-mono bg-slate-950/90 text-cyan-300 p-2.5 rounded-lg overflow-x-auto max-h-48 border border-slate-900">
                      {JSON.stringify(st.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
