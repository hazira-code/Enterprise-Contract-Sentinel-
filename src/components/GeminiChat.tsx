import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Globe,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  Scale,
  Zap,
  Cpu,
  FileText
} from 'lucide-react';
import type { ContractAuditResult } from '../types/contract.ts';

interface SearchSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  searchSources?: SearchSource[];
  searchQueries?: string[];
  modelUsed?: string;
  timestamp: string;
}

interface GeminiChatProps {
  currentAuditResult?: ContractAuditResult | null;
  currentContractText?: string;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
  currentAuditResult,
  currentContractText
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello, I am the **Sentinel Legal AI Counsel & Compliance Advisor**.

I can help you review commercial agreements against our four non-negotiable enterprise mandates:
1. **Liability Ceiling ($\le 150\%$ ACV)**
2. **GDPR Sovereign Storage & SCC Mandate**
3. **Delaware / New York Governing Law**
4. **Auto-Renewal Notice Window ($\ge 60$ Days)**

Ask me about any flagged violations in your contract, request compliant clause drafting, or inquire about current regulatory precedents using live **Google Search Grounding**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [enableSearch, setEnableSearch] = useState(true);
  const [includeContractContext, setIncludeContractContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      // Build contract context summary if enabled
      let contractContext = '';
      if (includeContractContext) {
        if (currentAuditResult) {
          contractContext = `Contract Title: ${currentAuditResult.title}
Contract ID: ${currentAuditResult.contract_id}
ACV: $${currentAuditResult.acv_usd.toLocaleString()} USD
Status: ${currentAuditResult.audit_status}
Flagged Violations:
${currentAuditResult.violations.map((v) => `- [${v.severity}] ${v.clause_reference}: ${v.explanation}`).join('\n')}

Contract Full Excerpt:
${currentAuditResult.raw_text.slice(0, 3000)}`;
        } else if (currentContractText) {
          contractContext = currentContractText.slice(0, 3000);
        }
      }

      // Convert messages to history payload for backend
      const historyPayload = newHistory
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          enableSearch: selectedModel === 'gemini-3.8-flash' ? enableSearch : false,
          contractContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Server request failed');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        searchSources: data.searchSources,
        searchQueries: data.searchQueries,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Advisory Notice**: Unable to query Gemini model. ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: 'Conversation history reset. Ready for your contract analysis or legal research inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  // Sample prompt queries tailored to the corporate mandates
  const promptSuggestions = [
    {
      label: 'Draft 150% ACV Cap Clause',
      prompt: 'Draft a bulletproof Limitation of Liability clause capped strictly at 150% of the Annual Contract Value under Delaware law with mutual disclaimer of consequential damages.'
    },
    {
      label: 'EDPB Sovereign Storage Rules',
      prompt: 'Search the latest European Data Protection Board (EDPB) rulings on storing EU customer personal data in Singapore or APAC cloud regions without Standard Contractual Clauses.'
    },
    {
      label: 'Delaware vs New York Jurisdiction',
      prompt: 'Compare Delaware Court of Chancery versus New York commercial courts for enterprise SaaS dispute resolution and explain why our corporate policy mandates either state.'
    },
    {
      label: 'Remediate 30-Day Auto-Renewal',
      prompt: 'Generate an amendment clause curing a 30-day auto-renewal clause to satisfy our corporate 60-day advance written notice requirement.'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header & Model Controls */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Sentinel Legal AI Counsel</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Multi-Turn
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive legal auditor powered by Gemini with live Google Search Grounding
            </p>
          </div>
        </div>

        {/* Model & Search Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Model Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-3.8-flash: General tasks with Google Search Grounding"
            >
              <Sparkles className="w-3 h-3" />
              <span>3.8-Flash</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-3.1-flash-lite: Fast clause drafting & low latency"
            >
              <Zap className="w-3 h-3" />
              <span>3.1-Lite</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-4-argon: Complex multi-jurisdictional legal reasoning"
            >
              <Cpu className="w-3 h-3" />
              <span>4-Argon</span>
            </button>
          </div>

          {/* Google Search Grounding Toggle (for gemini-3.8-flash) */}
          {selectedModel === 'gemini-3.8-flash' && (
            <button
              onClick={() => setEnableSearch(!enableSearch)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors flex items-center gap-1.5 ${
                enableSearch
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 font-medium'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
              title="Enables live Google Search Grounding for current legal statutes and precedent"
            >
              <Globe className="w-3 h-3" />
              <span>Search Grounding</span>
            </button>
          )}

          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Reset conversation thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contract Context Banner */}
      {currentAuditResult && (
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] truncate">
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-300 font-medium truncate">{currentAuditResult.title}</span>
            <span className="text-slate-600">·</span>
            <span>ACV: ${currentAuditResult.acv_usd.toLocaleString()}</span>
            <span className="text-slate-600">·</span>
            <span
              className={
                currentAuditResult.audit_status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {currentAuditResult.audit_status}
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeContractContext}
              onChange={(e) => setIncludeContractContext(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Inject Context</span>
          </label>
        </div>
      )}

      {/* Scrollable Message Thread */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Container */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 border transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                    : 'bg-slate-900/95 text-slate-200 border-slate-800 rounded-tl-none'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mb-1.5 gap-4">
                  <span>{isUser ? 'You' : 'Sentinel Legal Counsel'}</span>
                  <div className="flex items-center gap-2">
                    {message.modelUsed && !isUser && (
                      <span className="text-indigo-300">{message.modelUsed}</span>
                    )}
                    <span>{message.timestamp}</span>
                    <button
                      onClick={() => handleCopy(message.id, message.text)}
                      className="hover:text-white transition-colors"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs leading-relaxed whitespace-pre-wrap select-text font-sans space-y-2">
                  {message.text}
                </div>

                {/* Search Grounding Citations & Sources */}
                {message.searchSources && message.searchSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mb-2">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search Grounding Sources ({message.searchSources.length})</span>
                    </div>

                    {message.searchQueries && message.searchQueries.length > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 mb-2">
                        Query: {message.searchQueries.join(' · ')}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {message.searchSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-2 rounded bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-300 hover:text-white transition-colors flex items-center justify-between gap-2 group"
                        >
                          <span className="text-[11px] font-mono truncate">{source.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Analyzing legal clauses with {selectedModel}...</span>
              {selectedModel === 'gemini-3.8-flash' && enableSearch && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 ml-2">
                  <Globe className="w-3 h-3" /> Grounding with Google Search
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-mono text-slate-500 shrink-0">Suggested:</span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors border border-slate-700/60"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Sentinel AI about liability caps, GDPR sovereign storage, Delaware law, or redlines..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className={`p-3 rounded-xl transition-all shrink-0 flex items-center justify-center ${
              !inputPrompt.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95'
            }`}
            title="Send inquiry"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
