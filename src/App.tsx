import React, { useState } from 'react';
import { TopNav } from './components/TopNav.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { RulesManager } from './components/RulesManager.tsx';
import { ArchitectureView } from './components/ArchitectureView.tsx';
import { CodeExplorer } from './components/CodeExplorer.tsx';
import { GeminiChat } from './components/GeminiChat.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'rules' | 'chat' | 'architecture' | 'code'>('console');
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunAuditFromNav = () => {
    setActiveTab('console');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Contract (1 row, 3 zones, 5 single-line links) */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRunAudit={handleRunAuditFromNav}
        isAuditing={isAuditing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'console' && <Dashboard isAuditingExternal={isAuditing} />}
        {activeTab === 'rules' && <RulesManager />}
        {activeTab === 'chat' && (
          <div className="h-[750px]">
            <GeminiChat />
          </div>
        )}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'code' && <CodeExplorer />}
      </main>

      {/* Minimal Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Enterprise Contract Sentinel · Strict Local Data Residency & Air-Gapped Deployment</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Gemini 3.8-Flash (Google Search Grounding) · FastMCP · LangGraph</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
