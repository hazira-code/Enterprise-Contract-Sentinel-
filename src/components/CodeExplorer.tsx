import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';

import orchestratorAppCode from '@/agent-orchestrator/app.py?raw';
import mcpServerCode from '@/mcp-server/server.py?raw';
import trainQloraCode from '@/ai-engine/train_qlora.py?raw';
import evaluateRagasCode from '@/ai-engine/evaluate_ragas.py?raw';
import initSqlCode from '@/docker/init.sql?raw';
import dockerComposeCode from '@/docker/docker-compose.yml?raw';

interface FileEntry {
  path: string;
  category: 'ai-engine' | 'mcp-server' | 'agent-orchestrator' | 'docker';
  language: string;
  description: string;
  content: string;
}

const REPO_FILES: FileEntry[] = [
  {
    path: '/agent-orchestrator/app.py',
    category: 'agent-orchestrator',
    language: 'python',
    description: 'FastAPI server hosting the 3-node LangGraph workflow (Reader -> Auditor -> Writer)',
    content: orchestratorAppCode
  },
  {
    path: '/mcp-server/server.py',
    category: 'mcp-server',
    language: 'python',
    description: 'Official Python FastMCP server exposing database tools (rules, violations, status)',
    content: mcpServerCode
  },
  {
    path: '/ai-engine/train_qlora.py',
    category: 'ai-engine',
    language: 'python',
    description: 'PyTorch + Hugging Face BitsAndBytes QLoRA fine-tuning script for Llama-3-8B',
    content: trainQloraCode
  },
  {
    path: '/ai-engine/evaluate_ragas.py',
    category: 'ai-engine',
    language: 'python',
    description: 'Ragas evaluation framework script measuring extraction accuracy on 4 rules',
    content: evaluateRagasCode
  },
  {
    path: '/docker/init.sql',
    category: 'docker',
    language: 'sql',
    description: 'PostgreSQL schema DDL and ground-truth compliance rules seed script',
    content: initSqlCode
  },
  {
    path: '/docker/docker-compose.yml',
    category: 'docker',
    language: 'yaml',
    description: 'Master multi-container orchestration with air-gapped offline network',
    content: dockerComposeCode
  }
];

export const CodeExplorer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('/agent-orchestrator/app.py');
  const [copied, setCopied] = useState(false);

  const selectedMeta = REPO_FILES.find((f) => f.path === activeFile) || REPO_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedMeta.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Enterprise Monorepo Codebase Browser
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready scripts with explicit types, error logging, and zero placeholders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied File' : 'Copy Source'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: File Sidebar & Code Pane */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block px-2 py-1">
            Monorepo Tree
          </span>
          {REPO_FILES.map((file) => {
            const isSelected = activeFile === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-800/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">{file.path.split('/').pop()}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">{selectedMeta.path}</span>
            <span className="text-indigo-400 uppercase text-[10px]">{selectedMeta.language}</span>
          </div>

          <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800/60 text-xs text-slate-400">
            {selectedMeta.description}
          </div>

          <div className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto max-h-[550px] leading-relaxed">
            <pre className="whitespace-pre-wrap select-text font-mono text-xs text-slate-300">
              {selectedMeta.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
