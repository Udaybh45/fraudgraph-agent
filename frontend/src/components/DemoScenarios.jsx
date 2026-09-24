import React from 'react';
import { Play, ShieldAlert, Cpu, Compass, Users } from 'lucide-react';

export default function DemoScenarios({ onSelectScenario, activeScenarioIndex, isInvestigating }) {
  const scenarios = [
    {
      index: 1,
      id: "BENCHMARK-CASE-01",
      txn: "TXN-BM-1001",
      title: "Scenario 1: Device Farming Syndicate",
      badge: "Strong Evidence → Block",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: Cpu,
      desc: "Device fingerprint shared across 4 customer profiles with Bluestacks emulator environment and Tor routing.",
      amount: "$2,850.00",
      stepUp: "FAILED"
    },
    {
      index: 2,
      id: "BENCHMARK-CASE-02",
      txn: "TXN-BM-1002",
      title: "Scenario 2: Uncertainty-Gated Step-Up",
      badge: "Uncertain → 2FA Challenge → Action",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: ShieldAlert,
      desc: "Unrecognized device with elevated transaction velocity. Initial uncertainty triggers out-of-band biometric challenge.",
      amount: "$850.00",
      stepUp: "FAILED"
    },
    {
      index: 3,
      id: "BENCHMARK-CASE-03",
      txn: "TXN-BM-1003",
      title: "Scenario 3: Travel Anomaly (No Auto-Block)",
      badge: "Suspicious Context → Context → Allow",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: Compass,
      desc: "Travel hotel booking with new subnet. Agent verifies customer baseline and avoids unnecessary false-positive block.",
      amount: "$340.00",
      stepUp: "PASSED"
    },
    {
      index: 4,
      id: "BENCHMARK-CASE-04",
      txn: "TXN-BM-1004",
      title: "Scenario 4: High-Value Pass-Through Ring",
      badge: "Mule Ring → AML Tier-2 & FinCEN SAR",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: Users,
      desc: "Multi-hop pass-through chain exceeding $5,000 regulatory threshold. Mandates human AML specialist sign-off.",
      amount: "$9,200.00",
      stepUp: "FAILED"
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Interactive Hackathon Benchmark Scenarios
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">Click any scenario to execute live agent investigation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = activeScenarioIndex === sc.index;
          return (
            <div
              key={sc.index}
              onClick={() => !isInvestigating && onSelectScenario(sc)}
              className={`glass-card rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500/60 bg-emerald-950/20 glow-emerald'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              } ${isInvestigating ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">{sc.title}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">{sc.amount}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{sc.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                <button
                  disabled={isInvestigating}
                  className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'Investigating' : 'Run'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
