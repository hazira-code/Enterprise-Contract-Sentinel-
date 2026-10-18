import React from 'react';
import { ShieldCheck, Scale, Globe, FileClock, CheckCircle } from 'lucide-react';
import { ENTERPRISE_COMPLIANCE_RULES } from '../services/contractEngine.ts';

export const RulesManager: React.FC = () => {
  const getRuleIcon = (category: string) => {
    switch (category) {
      case 'LIABILITY':
        return Scale;
      case 'DATA_SOVEREIGNTY':
        return Globe;
      case 'GOVERNING_LAW':
        return ShieldCheck;
      case 'AUTO_RENEWAL':
        return FileClock;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Injected Enterprise Compliance Rules (The Ground Truth)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              These four immutable corporate mandates are seeded into PostgreSQL (`init.sql`) and queried dynamically by the LangGraph Auditor agent via the MCP tool `get_compliance_rules`.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-emerald-400 block font-semibold">
              4 Mandates Active
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Zero-Tolerance Policy
            </span>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENTERPRISE_COMPLIANCE_RULES.map((rule, idx) => {
          const Icon = getRuleIcon(rule.category);
          return (
            <div
              key={rule.rule_id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 block">
                        Rule 0{idx + 1} · {rule.rule_id}
                      </span>
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {rule.name}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      rule.severity === 'CRITICAL'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {rule.description}
                </p>
              </div>

              {/* Exact Parameters Enforced */}
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                  Enforced Parameters & Ground Truth Constraints
                </span>
                <div className="space-y-1 font-mono text-xs text-slate-300">
                  {rule.category === 'LIABILITY' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max ACV Cap Multiplier:</span>
                        <span className="text-emerald-400 font-semibold tabular-nums">1.5x (150% ACV)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Allow Uncapped Liability:</span>
                        <span className="text-rose-400 font-semibold">Strictly False</span>
                      </div>
                    </>
                  )}
                  {rule.category === 'DATA_SOVEREIGNTY' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Exclusive Storage:</span>
                        <span className="text-indigo-300">EU / EEA (Germany, France, etc.)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Require Executed SCCs:</span>
                        <span className="text-emerald-400 font-semibold">Mandatory</span>
                      </div>
                    </>
                  )}
                  {rule.category === 'GOVERNING_LAW' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Permitted Jurisdictions:</span>
                        <span className="text-indigo-300">Delaware (DE) or New York (NY)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Foreign / Other States:</span>
                        <span className="text-rose-400 font-semibold">Critical Violation</span>
                      </div>
                    </>
                  )}
                  {rule.category === 'AUTO_RENEWAL' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Minimum Notice Window:</span>
                        <span className="text-amber-400 font-semibold tabular-nums">&gt;= 60 Days Written Notice</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Silent Auto-Renewal:</span>
                        <span className="text-rose-400 font-semibold">Prohibited</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
