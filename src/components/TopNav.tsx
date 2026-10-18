import React from 'react';
import { ShieldCheck, Play } from 'lucide-react';

interface TopNavProps {
  activeTab: 'console' | 'rules' | 'chat' | 'architecture' | 'code';
  onTabChange: (tab: 'console' | 'rules' | 'chat' | 'architecture' | 'code') => void;
  onRunAudit: () => void;
  isAuditing: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onRunAudit,
  isAuditing
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark with clean icon */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/90 flex items-center justify-center text-white shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
          Enterprise Contract Sentinel
        </span>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onTabChange('console')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'console' ? 'text-white font-semibold underline underline-offset-8 decoration-indigo-500 decoration-2' : ''
          }`}
        >
          Audit Console
        </button>
        <button
          onClick={() => onTabChange('rules')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'rules' ? 'text-white font-semibold underline underline-offset-8 decoration-indigo-500 decoration-2' : ''
          }`}
        >
          Ground Truth Rules
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'chat' ? 'text-white font-semibold underline underline-offset-8 decoration-indigo-500 decoration-2' : ''
          }`}
        >
          AI Legal Counsel
        </button>
        <button
          onClick={() => onTabChange('architecture')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'architecture' ? 'text-white font-semibold underline underline-offset-8 decoration-indigo-500 decoration-2' : ''
          }`}
        >
          Architecture
        </button>
        <button
          onClick={() => onTabChange('code')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'code' ? 'text-white font-semibold underline underline-offset-8 decoration-indigo-500 decoration-2' : ''
          }`}
        >
          Monorepo Code
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            isAuditing
              ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-sm hover:shadow-indigo-500/25'
          }`}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isAuditing ? 'animate-pulse' : ''}`} />
          <span>{isAuditing ? 'Auditing Contract...' : 'Execute Audit'}</span>
        </button>
      </div>
    </header>
  );
};
