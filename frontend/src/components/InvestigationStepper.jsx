import React, { useRef, useEffect } from 'react';
import { Check, Slash } from 'lucide-react';

export default function InvestigationStepper({
  steps,
  currentStepIndex,
  completedStepIndex,
  skippedStepIndices = [],
  onStepClick
}) {
  const containerRef = useRef(null);

  // Auto-scroll active stepper into view
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.children[currentStepIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStepIndex]);

  return (
    <nav className="bg-[#0c1322] border-b border-slate-800/90 px-4 py-2 overflow-x-auto no-scrollbar shadow-inner">
      <div ref={containerRef} className="flex items-center min-w-max gap-1.5 text-xs">
        {steps.map((st, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isSkipped = skippedStepIndices.includes(idx);
          const isCompleted = idx < completedStepIndex && !isSkipped;
          const isClickable = (idx <= completedStepIndex && !isSkipped) || isCompleted;

          return (
            <div key={st.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition select-none ${
                  isCurrent
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : isSkipped
                    ? 'text-slate-600 line-through opacity-50 cursor-not-allowed bg-slate-900/40 border border-slate-900'
                    : isCompleted
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title={isSkipped ? `${st.label} (Not applicable for this investigation)` : st.label}
              >
                {/* Step badge */}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950'
                      : isSkipped
                      ? 'bg-slate-900 text-slate-600 border border-slate-800'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : isSkipped ? (
                    <Slash className="w-2.5 h-2.5 stroke-[2]" />
                  ) : (
                    String(idx + 1).padStart(2, '0')
                  )}
                </span>

                <span className="whitespace-nowrap tracking-tight text-[11px]">
                  {st.label}
                  {isSkipped && <span className="ml-1 text-[9px] text-slate-600 no-underline font-normal">(N/A)</span>}
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div className="w-2.5 h-px bg-slate-800 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
