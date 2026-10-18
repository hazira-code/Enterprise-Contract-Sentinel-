import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, FileCheck, CheckCircle } from 'lucide-react';
import type { Violation, ExtractedClauses, ComplianceStatus } from '../types/contract.ts';

interface ViolationsListProps {
  violations: Violation[];
  clauses?: ExtractedClauses;
  status: ComplianceStatus;
  acvUsd: number;
  onSelectClause?: (clauseRef: string) => void;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  clauses,
  status,
  acvUsd,
  onSelectClause
}) => {
  const criticalCount = violations.filter((v) => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter((v) => v.severity === 'WARNING').length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Status Summary Banner */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          status === 'FAILED_COMPLIANCE'
            ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
            : status === 'APPROVED'
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                status === 'FAILED_COMPLIANCE'
                  ? 'bg-rose-900/60 text-rose-300'
                  : status === 'APPROVED'
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : 'bg-amber-900/60 text-amber-300'
              }`}
            >
              {status === 'FAILED_COMPLIANCE' ? (
                <AlertOctagon className="w-5 h-5" />
              ) : status === 'APPROVED' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-wide uppercase">
                  {status === 'FAILED_COMPLIANCE'
                    ? 'Compliance Failure: Critical Violations Detected'
                    : status === 'APPROVED'
                    ? 'Compliance Approved: All Mandates Satisfied'
                    : 'Requires Legal Escalation'}
                </h3>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {status === 'FAILED_COMPLIANCE'
                  ? `Identified ${violations.length} violations (${criticalCount} Critical, ${warningCount} Warning) against enterprise ground-truth rules.`
                  : status === 'APPROVED'
                  ? 'The contract strictly satisfies the 150% Liability Cap, GDPR Sovereign Storage, Delaware/NY Law, and 60-Day Renewal.'
                  : 'Subtle commercial policy deviations detected requiring senior counsel review.'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono block opacity-70">Annual Contract Value</span>
            <span className="text-sm font-mono font-bold tabular-nums">
              ${acvUsd.toLocaleString()} USD
            </span>
          </div>
        </div>
      </div>

      {/* Extracted Entity Telemetry Strip */}
      {clauses && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Model Extraction Entities (Llama-3 QLoRA)</span>
            <span className="font-mono text-indigo-400">4 / 4 Extracted</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Liability Ceiling</span>
              <span className="font-mono font-semibold text-white mt-0.5 block tabular-nums">
                {clauses.liability.is_uncapped
                  ? 'UNCAPPED (Unlimited)'
                  : `${clauses.liability.cap_percentage_acv}% of ACV`}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Exposure: {clauses.liability.is_uncapped ? 'Infinite' : `$${(acvUsd * (clauses.liability.cap_percentage_acv || 100) / 100).toLocaleString()}`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Data Sovereignty</span>
              <span className="font-mono font-semibold text-white mt-0.5 block truncate">
                {clauses.data_sovereignty.storage_regions.join(', ') || 'Unspecified'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                SCCs: {clauses.data_sovereignty.sccs_present ? 'Executed' : 'Missing'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Governing Jurisdiction</span>
              <span className="font-mono font-semibold text-white mt-0.5 block truncate">
                {clauses.governing_law.governing_jurisdiction}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block truncate">
                Seat: {clauses.governing_law.court_seat}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Auto-Renewal Notice</span>
              <span className="font-mono font-semibold text-white mt-0.5 block tabular-nums">
                {clauses.auto_renewal.is_silent ? 'Silent (0 Days)' : `${clauses.auto_renewal.notice_window_days} Days`}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Req: At least 60 days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Structured Flagged Violations Feed */}
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">
            Flagged Violations & Remediations ({violations.length})
          </span>
          <span className="font-mono text-[11px]">Ground Truth Engine Active</span>
        </div>

        {violations.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-white">Zero Compliance Violations</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All tested clauses conform to the 150% liability cap, GDPR sovereignty mandates, Delaware/NY law, and 60-day renewal terms.
            </p>
          </div>
        ) : (
          violations.map((violation, idx) => (
            <div
              key={`${violation.rule_id}-${idx}`}
              className={`p-4 rounded-xl border transition-all ${
                violation.severity === 'CRITICAL'
                  ? 'bg-slate-900/90 border-rose-800/60 hover:border-rose-700'
                  : 'bg-slate-900/90 border-amber-800/60 hover:border-amber-700'
              }`}
            >
              {/* Unboxed Metadata Header with typographic separators */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-semibold ${
                      violation.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {violation.severity}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono text-slate-400">{violation.rule_id}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <button
                    onClick={() => onSelectClause && onSelectClause(violation.clause_reference)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline transition-colors"
                  >
                    {violation.clause_reference}
                  </button>
                </div>
              </div>

              {/* Primary Explanation */}
              <p className="text-xs text-slate-200 font-medium leading-relaxed mb-3">
                {violation.explanation}
              </p>

              {/* Raw Excerpt Quote */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 mb-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Contract Excerpt
                </span>
                <p className="text-xs font-mono text-slate-300 italic line-clamp-3">
                  "{violation.raw_text}"
                </p>
              </div>

              {/* Remediation Action */}
              <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-800/40">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-0.5">
                  Mandatory Legal Remediation
                </span>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  {violation.remediation}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
