import React, { useState } from 'react';
import { Database, Network, Cpu, Workflow, Monitor, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>('mcp');

  const components = [
    {
      id: 'postgres',
      title: 'Legacy Data (PostgreSQL)',
      layer: 'Data Storage',
      icon: Database,
      badge: 'Port 5432 · Internal Net',
      description: 'Enterprise relation database housing compliance rules, active contracts, and audit logs. Governed by init.sql schema and cryptographic foreign-key relationships.',
      isolationNote: 'Protected within private Docker bridge network. No internet exposure.',
      techStack: 'PostgreSQL 16 Alpine, ACID Transactions, JSONB compliance parameters'
    },
    {
      id: 'mcp',
      title: 'Secure MCP Server Bridge',
      layer: 'Protocol Layer',
      icon: Network,
      badge: 'Port 8001 · FastMCP SDK',
      description: 'Official Python Model Context Protocol (MCP) server providing three auditable tools to LangGraph: get_compliance_rules, flag_contract_violation, and update_contract_status.',
      isolationNote: 'Enforces principle of least privilege. Only exposes structured function calling tools without direct database access to agents.',
      techStack: 'Python 3.11, mcp==1.2.1, psycopg3 connection pool'
    },
    {
      id: 'llama3',
      title: 'Fine-Tuned Llama-3 (QLoRA)',
      layer: 'Inference Layer',
      icon: Cpu,
      badge: '4-Bit NF4 · Strict Air-Gap',
      description: 'Custom quantized Llama-3-8B adapter trained using BitsAndBytes NF4 and PEFT specifically to pull out Liability caps, GDPR terms, Governing Law, and Renewal timelines.',
      isolationNote: 'STRICT AIR-GAP: Container connected to ai-airgap-net with internal: true. Zero outbound internet routing.',
      techStack: 'PyTorch 2.3, Hugging Face Transformers, PEFT QLoRA, Ragas 0.1.9 benchmark'
    },
    {
      id: 'langgraph',
      title: 'LangGraph Agent Orchestrator',
      layer: 'Workflow Engine',
      icon: Workflow,
      badge: 'Port 8000 · FastAPI',
      description: 'Stateful 3-node directed agent graph: [Node 1: Reader] extracts clauses -> [Conditional Edge] validates schema -> [Node 2: Auditor] runs rule cross-reference -> [Node 3: Writer] commits MCP flags.',
      isolationNote: 'Maintains stateful audit checkpointing and transactional rollback capability.',
      techStack: 'LangGraph 0.1.4, LangChain Core, FastAPI, Pydantic v2'
    },
    {
      id: 'react',
      title: 'React + TypeScript UI',
      layer: 'Presentation Layer',
      icon: Monitor,
      badge: 'Port 3000 · Vite & Tailwind',
      description: 'Enterprise compliance dashboard featuring real-time node progress tracking, dual-pane document/violation viewer, and report generation.',
      isolationNote: 'Zero telemetry, no external font or script CDN tracking, fully hermetic build.',
      techStack: 'React 19, TypeScript, Tailwind CSS v4, Lucide Icons'
    }
  ];

  const activeComp = components.find((c) => c.id === selectedComponent) || components[1];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Architectural Blueprint & Data-Isolation Topology
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Fully on-premise, hermetic enterprise architecture. The AI inference container is strictly air-gapped from public networks, communicating exclusively through the Model Context Protocol (MCP) server bridge.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Air-Gapped & Offline</span>
          </div>
        </div>
      </div>

      {/* The 5-Node Interactive Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {components.map((comp, idx) => {
          const isSelected = selectedComponent === comp.id;
          const Icon = comp.icon;
          return (
            <button
              key={comp.id}
              onClick={() => setSelectedComponent(comp.id)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">0{idx + 1}</span>
              </div>
              <h3 className="text-xs font-semibold text-white tracking-tight mb-1">
                {comp.title}
              </h3>
              <p className="text-[11px] text-slate-400">{comp.layer}</p>
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-indigo-400 block truncate">
                  {comp.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Component Deep Dive */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                {activeComp.layer} Inspection
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {activeComp.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              {activeComp.description}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Isolation & Compliance Guarantee
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeComp.isolationNote}
            </p>
          </div>

          <div className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Technology Stack: </span>
            <span className="font-mono text-slate-400">{activeComp.techStack}</span>
          </div>
        </div>

        {/* Security Principles Checklist */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Enterprise Security Safeguards
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Offline weights cached locally without outbound HuggingFace pinging</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>MCP stdio / HTTP bridge prevents raw SQL injection from agent prompts</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Deterministic Ragas evaluation suite ensures continuous regression safety</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Network isolation guarantees no client contract text ever leaks off-premise</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
