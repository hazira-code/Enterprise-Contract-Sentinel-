import React from 'react';
import { Bot, ShieldAlert, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import type { TimelineEntry } from '../types/contract.ts';

interface LangGraphTrackerProps {
  currentNode: 'init' | 'reader' | 'auditor' | 'writer' | 'completed';
  isAuditing: boolean;
  timeline: TimelineEntry[];
}

export const LangGraphTracker: React.FC<LangGraphTrackerProps> = ({
  currentNode,
  isAuditing,
  timeline
}) => {
  const nodes = [
    {
      id: 'reader',
      name: 'Node 1: The Reader',
      role: 'Fine-Tuned Llama-3 QLoRA',
      desc: 'Extracts 4 compliance clauses into structured schema',
      icon: Bot
    },
    {
      id: 'auditor',
      name: 'Node 2: The Auditor',
      role: 'MCP Rule Engine',
      desc: 'Cross-references 150% liability, GDPR, & NY/DE law',
      icon: ShieldAlert
    },
    {
      id: 'writer',
      name: 'Node 3: The Writer',
      role: 'Postgres MCP Bridge',
      desc: 'Writes structured violation records & status update',
      icon: Database
    }
  ];

  const getNodeState = (nodeId: string) => {
    if (currentNode === 'completed') return 'completed';
    if (currentNode === nodeId) return isAuditing ? 'active' : 'completed';
    const order = ['init', 'reader', 'auditor', 'writer', 'completed'];
    const currentIndex = order.indexOf(currentNode);
    const nodeIndex = order.indexOf(nodeId);
    if (currentIndex > nodeIndex) return 'completed';
    return 'idle';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            LangGraph Execution State Machine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential stateful multi-agent workflow orchestrated offline
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="text-slate-400">Status:</span>
          <span className={isAuditing ? 'text-amber-400 font-medium' : currentNode === 'completed' ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
            {isAuditing ? 'Executing Agent Graph...' : currentNode === 'completed' ? 'Workflow Complete' : 'Standing By'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {nodes.map((node, idx) => {
          const state = getNodeState(node.id);
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              className={`p-4 rounded-lg border transition-all duration-200 relative ${
                state === 'active'
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : state === 'completed'
                  ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      state === 'active'
                        ? 'bg-indigo-600 text-white'
                        : state === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white tracking-tight">
                      {node.name}
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-400 block">
                      {node.role}
                    </span>
                  </div>
                </div>

                {state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : state === 'active' ? (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Running
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    Queued
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {node.desc}
              </p>

              {idx < nodes.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {timeline.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Latest Event: {timeline[timeline.length - 1].title}</span>
          <span className="font-mono text-[11px] text-slate-500">
            {timeline[timeline.length - 1].description}
          </span>
        </div>
      )}
    </div>
  );
};
