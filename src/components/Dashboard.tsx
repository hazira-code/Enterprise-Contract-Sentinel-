import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sliders,
  Terminal,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { LangGraphTracker } from './LangGraphTracker.tsx';
import { ContractViewer } from './ContractViewer.tsx';
import { ViolationsList } from './ViolationsList.tsx';
import { GeminiChat } from './GeminiChat.tsx';
import {
  SAMPLE_CONTRACTS,
  ENTERPRISE_COMPLIANCE_RULES,
  executeContractAuditWorkflow
} from '../services/contractEngine.ts';
import type {
  ContractAuditResult,
  ContractTemplate,
  MCPLogEntry
} from '../types/contract.ts';

interface DashboardProps {
  onTriggerAuditRef?: (triggerFn: () => void) => void;
  isAuditingExternal?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate>(SAMPLE_CONTRACTS[0]);
  const [currentContractText, setCurrentContractText] = useState<string>(SAMPLE_CONTRACTS[0].raw_text);
  const [contractTitle, setContractTitle] = useState<string>(SAMPLE_CONTRACTS[0].title);
  const [acvUsd, setAcvUsd] = useState<number>(SAMPLE_CONTRACTS[0].acv_usd);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [currentNode, setCurrentNode] = useState<'init' | 'reader' | 'auditor' | 'writer' | 'completed'>('completed');
  const [auditResult, setAuditResult] = useState<ContractAuditResult | null>(null);
  const [showMcpLogs, setShowMcpLogs] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Run audit for initial template on mount
  useEffect(() => {
    handleRunAudit(SAMPLE_CONTRACTS[0]);
  }, []);

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setCurrentContractText(template.raw_text);
    setContractTitle(template.title);
    setAcvUsd(template.acv_usd);
    handleRunAudit(template);
  };

  const handleRunAudit = async (templateOverride?: {
    id: string;
    title: string;
    counterparty?: string;
    raw_text: string;
    acv_usd: number;
  }) => {
    setIsAuditing(true);
    setCurrentNode('init');

    const target = templateOverride
      ? {
          contract_id: templateOverride.id,
          title: templateOverride.title,
          counterparty: templateOverride.counterparty,
          raw_text: templateOverride.raw_text,
          acv_usd: templateOverride.acv_usd
        }
      : {
          contract_id: selectedTemplate.id,
          title: contractTitle,
          counterparty: selectedTemplate.counterparty,
          raw_text: currentContractText,
          acv_usd: acvUsd
        };

    try {
      const result = await executeContractAuditWorkflow(
        {
          contract_id: target.contract_id || `CTR-${Date.now().toString(36).toUpperCase()}`,
          title: target.title,
          counterparty: target.counterparty,
          raw_text: target.raw_text,
          acv_usd: target.acv_usd
        },
        ENTERPRISE_COMPLIANCE_RULES,
        (step) => {
          setCurrentNode(step);
        }
      );

      setAuditResult(result);
      setCurrentNode('completed');
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCurrentContractText(text);
          setContractTitle(file.name.replace(/\.[^/.]+$/, ''));
          handleRunAudit({
            id: `CTR-UPLOAD-${Date.now().toString(36).toUpperCase()}`,
            title: file.name,
            counterparty: 'Custom Uploaded Counterparty',
            raw_text: text,
            acv_usd: acvUsd
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportReport = () => {
    if (!auditResult) return;
    const reportMarkdown = `# ENTERPRISE CONTRACT SENTINEL - AUDIT REPORT
Contract: ${auditResult.title}
Contract ID: ${auditResult.contract_id}
Counterparty: ${auditResult.counterparty || 'N/A'}
Annual Contract Value (ACV): $${auditResult.acv_usd.toLocaleString()} USD
Final Compliance Status: ${auditResult.audit_status}
Timestamp: ${auditResult.completed_at}

## GROUND TRUTH EVALUATION RESULTS
Total Violations: ${auditResult.violations.length}

${auditResult.violations
  .map(
    (v, i) => `### ${i + 1}. [${v.severity}] ${v.clause_reference} (${v.rule_id})
- **Explanation**: ${v.explanation}
- **Excerpt**: "${v.raw_text}"
- **Remediation**: ${v.remediation}
`
  )
  .join('\n')}

## MODEL EXTRACTION SUMMARY
- Liability Cap: ${auditResult.extracted_clauses.liability.is_uncapped ? 'UNCAPPED' : auditResult.extracted_clauses.liability.cap_percentage_acv + '% ACV'}
- Data Sovereignty Regions: ${auditResult.extracted_clauses.data_sovereignty.storage_regions.join(', ') || 'N/A'} (SCCs: ${auditResult.extracted_clauses.data_sovereignty.sccs_present ? 'Yes' : 'No'})
- Governing Law: ${auditResult.extracted_clauses.governing_law.governing_jurisdiction} (${auditResult.extracted_clauses.governing_law.court_seat})
- Renewal Notice: ${auditResult.extracted_clauses.auto_renewal.is_silent ? 'Silent Renewal' : auditResult.extracted_clauses.auto_renewal.notice_window_days + ' Days'}
`;

    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sentinel_Audit_${auditResult.contract_id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Contract Template Selector & Upload Control Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
              Contract Scenario & Sample Suite
            </span>
            <span className="text-xs text-slate-400">
              Select an enterprise sample or drop any custom PDF/agreement below
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_CONTRACTS.map((template) => {
              const isSelected = selectedTemplate.id === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{template.title.split('(')[0]}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      template.expectedStatus === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/80'
                    }`}
                  >
                    {template.expectedStatus === 'APPROVED' ? 'Compliant' : 'Violations'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
            dragActive
              ? 'border-indigo-400 bg-indigo-950/30'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-slate-300">
              Drag & drop contract files here, or paste custom agreement text directly into the left viewer.
            </span>
            <label className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
              Browse
              <input
                type="file"
                className="hidden"
                accept=".txt,.pdf,.md,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text) {
                        setCurrentContractText(text);
                        setContractTitle(file.name);
                        handleRunAudit({
                          id: `CTR-UPLOAD-${Date.now().toString(36).toUpperCase()}`,
                          title: file.name,
                          counterparty: 'Custom Uploaded Counterparty',
                          raw_text: text,
                          acv_usd: acvUsd
                        });
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Real-time LangGraph Execution State Machine */}
      <LangGraphTracker
        currentNode={currentNode}
        isAuditing={isAuditing}
        timeline={auditResult?.timeline || []}
      />

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">ACV Parameter:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">$</span>
            <input
              type="number"
              value={acvUsd}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setAcvUsd(val);
              }}
              className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white tabular-nums text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-slate-500">USD</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">150% Ceiling:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            ${Math.round(acvUsd * 1.5).toLocaleString()} USD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatModal(!showChatModal)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              showChatModal
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-indigo-400 border-indigo-900/60 hover:border-indigo-700 hover:text-indigo-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Legal Counsel</span>
          </button>

          <button
            onClick={() => setShowMcpLogs(!showMcpLogs)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              showMcpLogs
                ? 'bg-slate-800 text-indigo-400 border-indigo-500/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>MCP Logs ({auditResult?.mcp_logs?.length || 0})</span>
          </button>

          <button
            onClick={handleExportReport}
            disabled={!auditResult}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Interactive AI Legal Counsel Panel (when toggled from toolbar) */}
      {showChatModal && (
        <div className="h-[520px] rounded-2xl overflow-hidden border border-indigo-500/40 shadow-2xl relative">
          <button
            onClick={() => setShowChatModal(false)}
            className="absolute top-4 right-4 z-20 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
          >
            Close Panel
          </button>
          <GeminiChat
            currentAuditResult={auditResult}
            currentContractText={currentContractText}
          />
        </div>
      )}

      {/* Dual-Pane Split Window */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[650px] min-h-0">
        {/* Left Pane: Full Contract Document */}
        <div className="h-full min-h-0 flex flex-col">
          <ContractViewer
            rawText={currentContractText}
            contractTitle={contractTitle}
            contractId={auditResult?.contract_id || selectedTemplate.id}
            counterparty={selectedTemplate.counterparty}
            acvUsd={acvUsd}
            extractedClauses={auditResult?.extracted_clauses}
            violations={auditResult?.violations || []}
          />
        </div>

        {/* Right Pane: AI-Flagged Compliance Violations */}
        <div className="h-full min-h-0 flex flex-col">
          <ViolationsList
            violations={auditResult?.violations || []}
            clauses={auditResult?.extracted_clauses}
            status={auditResult?.audit_status || 'PENDING_AUDIT'}
            acvUsd={acvUsd}
          />
        </div>
      </div>

      {/* MCP Activity Log Drawer */}
      {showMcpLogs && auditResult && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span className="font-semibold text-white">Model Context Protocol (MCP) Audit Ledger</span>
            <span className="text-[11px]">Database Tools Bridge Logs</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {auditResult.mcp_logs.map((log, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-semibold">{log.tool}()</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">{log.action}</span>
                  </div>
                  {log.payload && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Payload: {JSON.stringify(log.payload)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
