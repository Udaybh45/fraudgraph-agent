import React from 'react';
import { ShieldCheck, Play, Pause, FastForward, RotateCcw, Sparkles, BarChart2, ChevronRight } from 'lucide-react';

export default function Header({
  caseId,
  scenarios,
  activeScenarioIndex,
  onSelectScenario,
  onRunFull,
  onNextStep,
  onReset,
  isRunningFull,
  currentStepIndex,
  totalSteps,
  steps,
  skippedStepIndices = [],
  completedStepIndex,
  onGoToStep,
  onOpenExplainability,
  onOpenBenchmark,
  isInvestigating,
}) {
  const currentStep = steps[currentStepIndex];

  return (
    <header className="bg-[#0b101e] border-b border-slate-700/80 sticky top-0 z-50 shadow-lg">
      {/* TOP BAR */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">FraudGraph Agent</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                TigerGraph · HHGOA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Agentic Fraud Investigation &amp; Next-Best-Action Platform</p>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1">
          <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:block">Demo:</span>
          {scenarios.map((sc) => (
            <button
              key={sc.index}
              onClick={() => onSelectScenario(sc)}
              disabled={isInvestigating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeScenarioIndex === sc.index
                  ? 'bg-slate-700 text-white shadow-sm border border-slate-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={sc.title}
            >
              {sc.shortTitle}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onRunFull}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm transition cursor-pointer ${
              isRunningFull
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isRunningFull ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunningFull ? 'Pause' : 'Run Full Flow'}</span>
          </button>

          <button
            onClick={onNextStep}
            disabled={currentStepIndex >= totalSteps - 1 || isRunningFull}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 font-semibold text-sm transition cursor-pointer"
          >
            Next
            <FastForward className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <button
            onClick={onOpenBenchmark}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-sm transition cursor-pointer"
            title="View HHGOA Benchmark Results"
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Benchmark</span>
          </button>

          <button
            onClick={onOpenExplainability}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-sm transition cursor-pointer"
            title="Explain Decision"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Explain</span>
          </button>
        </div>
      </div>

      {/* PROGRESS STEPPER — compact strip showing current stage */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2">
          {/* Stage counter */}
          <div className="shrink-0 flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-mono font-black text-xs">
              {currentStep?.short}
            </span>
            <span className="text-cyan-300">{currentStep?.label}</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-0.5 h-2.5">
            {steps.map((step, idx) => {
              const isSkipped = skippedStepIndices.includes(idx);
              const isCompleted = idx < currentStepIndex && !isSkipped;
              const isCurrent = idx === currentStepIndex;
              const isClickable = idx <= completedStepIndex && !isSkipped;
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onGoToStep(idx)}
                  title={isSkipped ? `${step.label} (Skipped — not applicable)` : step.label}
                  className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
                      : isSkipped
                      ? 'bg-slate-700/40 opacity-30'
                      : isCompleted
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-slate-700/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Step counter text */}
          <div className="shrink-0 text-xs font-mono text-slate-400">
            {currentStepIndex + 1} / {totalSteps - skippedStepIndices.length} active
          </div>

          {/* Loading dot */}
          {isInvestigating && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Loading case...
            </div>
          )}
        </div>

        {/* Skipped stage labels */}
        {skippedStepIndices.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <span>Skipped:</span>
            {skippedStepIndices.map(i => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 line-through">
                {steps[i]?.short} {steps[i]?.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
