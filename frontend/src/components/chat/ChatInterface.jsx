import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../../services/chatApi';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  ShieldCheck,
  Trash2,
  Clock,
  ListFilter,
} from 'lucide-react';

export default function ChatInterface({ onCitationClick }) {
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  useEffect(() => {
    chatApi
      .getMessages()
      .then((res) => {
        if (res && res.success) {
          setMessages(res.messages || []);
        }
      })
      .catch((err) => console.error('[Load Messages Error]:', err));
  }, []);

  const handleSendMessage = async (e, customText) => {
    e?.preventDefault();
    const queryText = (customText || inputQuestion).trim();
    if (!queryText || isGenerating) return;

    setInputQuestion('');

    const userMsgId = Date.now().toString();
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg = {
      role: 'user',
      content: queryText,
      _id: userMsgId,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsGenerating(true);

    try {
      const res = await chatApi.sendMessage(queryText);
      const assistantMsgId = (Date.now() + 1).toString();
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res && res.success === false) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${res.message || 'Failed to generate answer.'}`,
            sources: [],
            _id: assistantMsgId,
            timestamp: assistantTimestamp,
          },
        ]);
      } else {
        const answerText = res?.answer || (typeof res === 'string' ? res : null);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: answerText || 'I could not generate an answer from the PDF.',
            sources: res?.sources || [],
            _id: assistantMsgId,
            timestamp: assistantTimestamp,
          },
        ]);
      }
    } catch (error) {
      console.error('[Chat Error]:', error);
      const errorMsg = error.message || 'Error generating answer.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          sources: [],
          _id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (content, id) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const sampleQuestions = [
    { text: 'What is the main topic of this PDF?', icon: HelpCircle, category: 'Overview' },
    { text: 'Summarize key points in simple terms.', icon: Zap, category: 'Summary' },
    { text: 'What are the main findings or conclusions?', icon: ShieldCheck, category: 'Insights' },
    { text: 'List the important requirements or rules.', icon: ListFilter, category: 'Details' },
  ];

  const quickPromptChips = [
    'Summarize PDF',
    'Key Takeaways',
    'Main Findings',
    'Requirements',
  ];

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7] font-sans antialiased text-[#1d1d1f]">
      {/* Apple-Style Glassmorphic Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border-b border-black/[0.06] shrink-0 sticky top-0 z-20 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0071e3] text-white flex items-center justify-center shadow-md shadow-[#0071e3]/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#1d1d1f] tracking-tight">
                AskPDF <span className="text-[#0071e3] font-bold">AI</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gemini Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">Grounded Q&A with Page Citations</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearMessages}
            className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-all duration-200"
            title="Clear Chat View"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-auto p-5 sm:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 && !isGenerating && (
          <div className="my-8 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-white border border-black/[0.06] text-[#0071e3] flex items-center justify-center mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <Bot className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-[#1d1d1f] text-xl tracking-tight">How can I help with your PDF?</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-normal">
                Choose a suggested prompt or type a question below to analyze your document.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {sampleQuestions.map((item, idx) => {
                const SampleIcon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={(e) => handleSendMessage(e, item.text)}
                    className="text-left p-4 rounded-2xl bg-white hover:bg-[#e8e8ed]/60 border border-black/[0.06] hover:border-[#0071e3]/30 text-[#1d1d1f] font-medium text-xs transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,113,227,0.08)] flex flex-col justify-between space-y-3 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <SampleIcon className="h-4 w-4 text-[#0071e3] group-hover:scale-110 transition-transform shrink-0" />
                      <span className="text-[10px] text-slate-400 font-medium bg-[#f5f5f7] px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <span className="leading-relaxed text-slate-700 font-normal">"{item.text}"</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const msgKey = msg._id || idx.toString();
          return (
            <div
              key={msgKey}
              className={`flex gap-3.5 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#0071e3]/20">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] text-xs sm:text-sm leading-relaxed transition-all ${
                  msg.role === 'user'
                    ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-[24px] rounded-tr-[4px] px-6 py-4 shadow-[0_2px_12px_rgba(0,113,227,0.2)] font-medium space-y-3'
                    : 'bg-white border border-black/[0.06] text-[#1d1d1f] rounded-[24px] rounded-tl-[4px] px-6 py-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] font-normal space-y-4'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                  {msg.role === 'assistant' && msg.content && (
                    <button
                      onClick={() => handleCopyText(msg.content, msgKey)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                      title="Copy response"
                    >
                      {copiedId === msgKey ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sources & Apple-Style Citation Pills */}
                <div className="flex items-center justify-between pt-3.5 border-t border-black/[0.05] text-[11px]">
                  {msg.sources && msg.sources.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 w-full">
                      <span className="font-semibold text-slate-400 block mr-1 text-[10px] uppercase tracking-wider">
                        Citations:
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() =>
                            onCitationClick &&
                            onCitationClick({
                              pageNumber: src.pageNumber,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0071e3] border border-black/[0.06] font-semibold text-[11px] transition-all duration-200 cursor-pointer shadow-2xs"
                        >
                          <FileText className="h-3 w-3 text-[#0071e3]" />
                          <span>Page {src.pageNumber}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">Generated via Gemini RAG</span>
                  )}

                  {msg.timestamp && (
                    <span className="flex items-center gap-1 shrink-0 text-slate-400 text-[10px] font-normal ml-auto">
                      <Clock className="h-2.5 w-2.5 opacity-60" />
                      <span>{msg.timestamp}</span>
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-3.5 sm:gap-4 justify-start">
            <div className="w-9 h-9 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#0071e3]/20">
              <Bot className="h-4.5 w-4.5" />
            </div>

            <div className="max-w-[85%] rounded-[24px] rounded-tl-[4px] px-6 py-5 bg-white border border-black/[0.06] text-[#1d1d1f] shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 text-[#0071e3] font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching document & generating answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips Row */}
      <div className="px-5 py-2.5 bg-white/50 border-t border-black/[0.04] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {quickPromptChips.map((chip, idx) => (
          <button
            key={idx}
            disabled={isGenerating}
            onClick={(e) => handleSendMessage(e, chip)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] border border-black/[0.08] font-medium text-xs whitespace-nowrap transition-all duration-200 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.02)] disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Apple-Style Input Form Bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-black/[0.06] shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="relative flex items-center max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Ask a question about your PDF..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isGenerating}
            className="w-full pl-5 pr-14 py-3 rounded-full bg-[#f5f5f7] border border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 text-xs sm:text-sm text-[#1d1d1f] placeholder-slate-400 transition-all duration-200 shadow-inner disabled:opacity-50 font-normal outline-none"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isGenerating}
            className="absolute right-1.5 p-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-30 text-white transition-all duration-200 shadow-md shadow-[#0071e3]/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
