import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StageContent from './components/StageContent';
import ExplainabilityModal from './components/ExplainabilityModal';
import BenchmarkResultsModal from './components/BenchmarkResultsModal';

import {
  fetchHealth,
  fetchBenchmarks,
  fetchBenchmarkResults,
  triggerInvestigation,
  approveCaseAction,
  fetchTransactionGraph
} from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [benchmarkResults, setBenchmarkResults] = useState([]);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(1);
  const [currentCase, setCurrentCase] = useState(null);
  const [subgraph, setSubgraph] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedStepIndex, setCompletedStepIndex] = useState(0);
  const [isRunningFull, setIsRunningFull] = useState(false);
  const timerRef = useRef(null);

  const steps = [
    { id: 'trigger',      label: 'Trigger',            short: '01' },
    { id: 'case_created', label: 'Case Created',        short: '02' },
    { id: 'investigate',  label: 'Graph Investigation', short: '03' },
    { id: 'evidence',     label: 'Evidence',            short: '04' },
    { id: 'pattern',      label: 'Fraud Pattern',       short: '05' },
    { id: 'risk',         label: 'Risk & Uncertainty',  short: '06' },
    { id: 'step_up',      label: 'Additional Evidence', short: '07' },
    { id: 'reassess',     label: 'Reassessment',        short: '08' },
    { id: 'nba',          label: 'Next Best Action',    short: '09' },
    { id: 'policy',       label: 'Policy Check',        short: '10' },
    { id: 'approval',     label: 'Human Approval',      short: '11' },
    { id: 'execution',    label: 'Execution',           short: '12' },
    { id: 'resolution',   label: 'Resolution',          short: '13' },
    { id: 'memory',       label: 'Case Memory',         short: '14' },
  ];

  // Conditional skips — derived from backend caseData, not hard-coded
  const skippedStepIndices = useMemo(() => {
    const skipped = [];
    if (!currentCase) return skipped;
    const ra = currentCase.risk_assessment || {};
    const nba = currentCase.next_best_action || {};
    const perm = currentCase.permission_check || {};
    const confScore = ra.confidence_score ?? 0;
    const additionalRequired = ra.additional_evidence_required === true || currentCase.additional_evidence_required === true;
    if (confScore >= 0.65 && !additionalRequired) {
      skipped.push(6, 7); // Skip Additional Evidence & Reassessment
    }
    const requiresApproval = perm.requires_approval === true ||
      (nba.required_approval && !String(nba.required_approval).toUpperCase().includes('AUTOMATED'));
    if (!requiresApproval) {
      skipped.push(10); // Skip Human Approval
    }
    return skipped;
  }, [currentCase]);

  const getNextValidIndex = (from) => {
    let next = from + 1;
    while (next < steps.length && skippedStepIndices.includes(next)) next++;
    return next;
  };

  const scenarios = [
    { index: 1, txn: 'TXN-BM-1001', shortTitle: 'S1 · Device Farm',   title: 'Scenario 1: Definite Device Farming Syndicate',    stepUp: 'FAILED' },
    { index: 2, txn: 'TXN-BM-1002', shortTitle: 'S2 · Uncertain',      title: 'Scenario 2: Uncertainty-Gated Step-Up',            stepUp: 'FAILED' },
    { index: 3, txn: 'TXN-BM-1003', shortTitle: 'S3 · Travel Anomaly', title: 'Scenario 3: Travel Anomaly (No Auto-Block)',        stepUp: 'PASSED' },
    { index: 4, txn: 'TXN-BM-1004', shortTitle: 'S4 · Mule Ring',      title: 'Scenario 4: High-Value Mule Ring',                 stepUp: 'FAILED' },
  ];

  useEffect(() => {
    async function init() {
      try {
        await fetchHealth().then(setHealth).catch(() => {});
        await fetchBenchmarkResults().then(r => setBenchmarkResults(Array.isArray(r) ? r : [])).catch(() => {});
        await loadScenarioData(scenarios[0]);
      } catch (e) { console.warn('Init error:', e); }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScenarioData = async (sc) => {
    setIsInvestigating(true);
    try {
      const result = await triggerInvestigation(sc.txn, sc.title, sc.stepUp);
      setCurrentCase(result);
      if (result.subgraph) {
        setSubgraph(result.subgraph);
      } else {
        await fetchTransactionGraph(sc.txn).then(setSubgraph).catch(() => {});
      }
    } catch (e) { console.warn('Scenario load error:', e); }
    finally { setIsInvestigating(false); }
  };

  const loadScenario = async (sc) => {
    setActiveScenarioIndex(sc.index);
    setCurrentStepIndex(0);
    setCompletedStepIndex(0);
    setIsRunningFull(false);
    if (timerRef.current) clearInterval(timerRef.current);
    await loadScenarioData(sc);
  };

  const handleNextStage = () => {
    const next = getNextValidIndex(currentStepIndex);
    if (next < steps.length) {
      setCurrentStepIndex(next);
      setCompletedStepIndex(p => Math.max(p, next));
    }
  };

  const handleGoToStep = (idx) => {
    if (skippedStepIndices.includes(idx) || idx > completedStepIndex) return;
    setCurrentStepIndex(idx);
    setIsRunningFull(false);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCompletedStepIndex(0);
    setIsRunningFull(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleRunFull = () => {
    if (isRunningFull) {
      setIsRunningFull(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const startFrom = currentStepIndex >= steps.length - 1 ? -1 : currentStepIndex;
    const ref = { idx: startFrom };
    if (startFrom === -1) { setCurrentStepIndex(0); setCompletedStepIndex(0); ref.idx = -1; }
    setIsRunningFull(true);
    timerRef.current = setInterval(() => {
      const next = getNextValidIndex(ref.idx);
      if (next >= steps.length) { clearInterval(timerRef.current); setIsRunningFull(false); return; }
      ref.idx = next;
      setCurrentStepIndex(next);
      setCompletedStepIndex(p => Math.max(p, next));
    }, 1600);
  };

  const handleApproveAction = async (payload) => {
    if (!currentCase?.case_id) return;
    setIsProcessingApproval(true);
    try {
      const res = await approveCaseAction(currentCase.case_id, payload);
      setCurrentCase(prev => ({ ...prev, approval_status: payload.decision === 'APPROVE' ? 'APPROVED' : 'OVERRIDDEN', executed_action: res.executed_action, status: 'RESOLVED' }));
    } catch (e) { console.warn(e); }
    finally { setIsProcessingApproval(false); }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <Header
        caseId={currentCase?.case_id}
        scenarios={scenarios}
        activeScenarioIndex={activeScenarioIndex}
        onSelectScenario={loadScenario}
        onRunFull={handleRunFull}
        onNextStep={handleNextStage}
        onReset={handleReset}
        isRunningFull={isRunningFull}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        steps={steps}
        skippedStepIndices={skippedStepIndices}
        completedStepIndex={completedStepIndex}
        onGoToStep={handleGoToStep}
        onOpenExplainability={() => setIsExplainModalOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkModalOpen(true)}
        isInvestigating={isInvestigating}
      />

      {/* 2-column workspace: slim sidebar + large main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          caseData={currentCase}
          currentStepIndex={currentStepIndex}
          skippedStepIndices={skippedStepIndices}
          isInvestigating={isInvestigating}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <StageContent
            currentStepIndex={currentStepIndex}
            caseData={currentCase}
            subgraph={subgraph}
            onNextStage={handleNextStage}
            onGoToStep={handleGoToStep}
            onApproveAction={handleApproveAction}
            onDispatchStepUp={handleNextStage}
            onOpenExplainability={() => setIsExplainModalOpen(true)}
            isProcessing={isProcessingApproval}
            isInvestigating={isInvestigating}
            skippedStepIndices={skippedStepIndices}
          />
        </main>
      </div>

      <ExplainabilityModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        explanations={currentCase?.explanations}
        caseId={currentCase?.case_id}
        transactionId={currentCase?.transaction_id}
      />
      <BenchmarkResultsModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        benchmarkResults={benchmarkResults}
        onSelectCase={(i) => { const sc = scenarios[Math.min(i - 1, scenarios.length - 1)]; if (sc) loadScenario(sc); }}
      />
    </div>
  );
}
