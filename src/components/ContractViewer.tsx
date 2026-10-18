import React, { useState } from 'react';
import { Search, FileText, Bookmark, Copy, Check } from 'lucide-react';
import type { ExtractedClauses, Violation } from '../types/contract.ts';

interface ContractViewerProps {
  rawText: string;
  contractTitle: string;
  contractId: string;
  counterparty?: string;
  acvUsd: number;
  extractedClauses?: ExtractedClauses;
  violations?: Violation[];
}

export const ContractViewer: React.FC<ContractViewerProps> = ({
  rawText,
  contractTitle,
  contractId,
  counterparty = 'Vendor / Counterparty',
  acvUsd,
  extractedClauses,
  violations = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const lines = rawText.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLiabilityLine = (line: string) =>
    /LIMITATION OF LIABILITY|aggregate liability|250%|150%|100%|uncapped/i.test(line);

  const isDataSovereigntyLine = (line: string) =>
    /DATA PROTECTION|SOVEREIGNTY|GDPR|Singapore|Malaysia|Frankfurt|Germany|Standard Contractual Clauses|SCCs/i.test(line);

  const isGoverningLawLine = (line: string) =>
    /GOVERNING LAW|JURISDICTION|Delaware|New York|England|London/i.test(line);

  const isRenewalLine = (line: string) =>
    /TERM AND RENEWAL|TERMINATION|automatically renew|thirty \(30\) days|ninety \(90\) days|renews silently/i.test(line);

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
      {/* Top Document Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <h2 className="text-sm font-semibold text-white truncate max-w-md">
              {contractTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded transition-colors flex items-center gap-1.5"
              title="Copy raw contract text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Unboxed Document Metadata */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
          <span>ID: {contractId}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>Party: {counterparty}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="tabular-nums">ACV: ${acvUsd.toLocaleString()} USD</span>
        </div>
      </div>

      {/* Clause Quick Jump Toolbar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
          <Bookmark className="w-3 h-3 text-indigo-400" />
          <span>Quick Clause Jumps:</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/40">
            Liability
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
            GDPR / Sovereignty
          </span>
          <span className="px-2 py-0.5 rounded bg-violet-950/50 text-violet-300 border border-violet-800/40">
            Governing Law
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
            Renewal
          </span>
        </div>
      </div>

      {/* Contract Text Body */}
      <div className="flex-1 min-h-0 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text space-y-1 bg-slate-950/90 text-slate-300">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isLiab = isLiabilityLine(line);
          const isData = isDataSovereigntyLine(line);
          const isLaw = isGoverningLawLine(line);
          const isRenewal = isRenewalLine(line);

          let highlightClass = '';
          if (isLiab) highlightClass = 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500 pl-2 -ml-2 py-0.5';
          else if (isData) highlightClass = 'bg-indigo-950/40 text-indigo-200 border-l-2 border-indigo-500 pl-2 -ml-2 py-0.5';
          else if (isLaw) highlightClass = 'bg-violet-950/40 text-violet-200 border-l-2 border-violet-500 pl-2 -ml-2 py-0.5';
          else if (isRenewal) highlightClass = 'bg-amber-950/40 text-amber-200 border-l-2 border-amber-500 pl-2 -ml-2 py-0.5';

          return (
            <div key={lineNum} className={`flex items-start gap-3 rounded ${highlightClass}`}>
              <span className="w-8 shrink-0 text-slate-400 select-none text-right text-[11px] tabular-nums font-mono">
                {lineNum}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-words">
                {line || ' '}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
