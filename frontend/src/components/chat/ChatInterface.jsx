import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles, FileText, ExternalLink, Loader2 } from 'lucide-react';

export default function ChatInterface({ onCitationClick }) {
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  useEffect(() => {
    axios
      .get('/api/messages')
      .then((res) => {
        if (res.data.success) {
          setMessages(res.data.messages || []);
        }
      })
      .catch((err) => console.error('[Load Messages Error]:', err));
  }, []);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputQuestion.trim() || isGenerating) return;

    const userQuestionText = inputQuestion.trim();
    setInputQuestion('');

    const newUserMsg = { role: 'user', content: userQuestionText, _id: Date.now().toString() };
    setMessages((prev) => [...prev, newUserMsg]);

    setIsGenerating(true);

    try {
      const response = await axios.post('/api/chat', { question: userQuestionText });
      const { answer, sources } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          sources: sources || [],
          _id: Date.now().toString(),
        },
      ]);
    } catch (error) {
      console.error('[Chat Error]:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error generating answer.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          sources: [],
          _id: Date.now().toString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">AskPDF <span className="text-blue-600">AI</span> Chat</h3>
            <p className="text-xs text-slate-500">Ask questions about your PDF document</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && !isGenerating && (
          <div className="my-8 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <Bot className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Ask a question about your document</h4>
            <p className="text-xs text-slate-500">
              Click a sample question to try:
            </p>
            <div className="space-y-2 text-xs">
              {[
                'What is the main topic of this PDF?',
                'Summarize key points in simple terms.',
                'What are the findings or conclusions?',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputQuestion(sample)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none font-medium'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Source Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() =>
                          onCitationClick &&
                          onCitationClick({
                            pageNumber: src.pageNumber,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold transition-colors"
                      >
                        <FileText className="h-3 w-3 text-blue-600" />
                        <span>Page {src.pageNumber}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
              <Bot className="h-4 w-4" />
            </div>

            <div className="max-w-[85%] rounded-xl p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none space-y-2 text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching PDF & generating answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type your question about the PDF..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isGenerating}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isGenerating}
            className="absolute right-1.5 p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-colors"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
