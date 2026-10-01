import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FileText,
  Trash2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Zap,
  Brain,
  Database,
  Search,
  ArrowRight,
  ShieldCheck,
  Layers,
  Cloud,
  Cpu,
} from 'lucide-react';
import DocumentUploader from '../components/document/DocumentUploader';

export default function Dashboard() {
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/document');
      if (res && res.success && res.document) {
        setDocument(res.document);
      } else {
        setDocument(null);
      }
    } catch (err) {
      console.error('[Fetch Document Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, []);

  const handleUploadSuccess = (uploadedDoc) => {
    setDocument(uploadedDoc);
  };

  const handleDeleteDocument = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;

    try {
      await api.delete('/document');
      setDocument(null);
    } catch (err) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ready for Q&A</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            <span>Processing Vectors...</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-3 py-1 rounded-full border border-red-200 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Uploading</span>
          </div>
        );
    }
  };

  const pipelineSteps = [
    {
      step: '01',
      icon: Cloud,
      title: 'Cloud Storage',
      desc: 'Your PDF is uploaded securely to Cloudinary raw cloud storage for persistent asset management.',
      badge: 'Cloudinary API',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '02',
      icon: Layers,
      title: 'Text Extraction & Chunking',
      desc: 'pdf-parse extracts page text, dividing content into ~800 character context windows with page numbers.',
      badge: 'pdf-parse',
      color: 'from-cyan-500 to-indigo-500',
    },
    {
      step: '03',
      icon: Brain,
      title: 'Gemini Vector Embeddings',
      desc: 'Google Gemini Embedding AI transforms text chunks into high-dimensional vector representations.',
      badge: 'gemini-embedding-001',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      step: '04',
      icon: Search,
      title: 'Vector Cosine Matching',
      desc: 'Cosine similarity algorithm calculates mathematical similarity between your query and document chunks.',
      badge: 'Vector Math',
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: '05',
      icon: Cpu,
      title: 'Gemini LLM Answer Generation',
      desc: 'Gemini Flash AI generates precise answers grounded strictly in your PDF context with page citations.',
      badge: 'gemini-3.5-flash-lite',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 pb-16">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>AI-Powered Document Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Chat with Your PDF Documents using <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">Gemini RAG AI</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            Upload any PDF to extract instant answers, exact page citations, and AI vector search powered by Google Gemini and Cloudinary.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant Answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Page Citations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-cyan-400" />
              <span>Vector Embeddings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-10 relative z-20">
        {/* Upload Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Upload PDF Document</h2>
              <p className="text-xs text-slate-500">Supported format: Single PDF file (up to 50MB)</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hidden sm:block">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <DocumentUploader onUploadSuccess={handleUploadSuccess} />

          {/* Active PDF Document Card */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Active PDF Document
              </span>
              {document && document.status === 'ready' && (
                <span className="text-xs text-blue-600 font-semibold">1 Active Document Loaded</span>
              )}
            </h3>

            {isLoading ? (
              <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Checking active document...</p>
              </div>
            ) : !document ? (
              <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-300">
                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-700 font-semibold text-sm">No PDF uploaded yet</p>
                <p className="text-slate-500 text-xs mt-1">Upload a PDF document above to begin asking questions.</p>
              </div>
            ) : (
              <div
                onClick={() => document.status === 'ready' && navigate('/chat')}
                className={`bg-slate-50/80 rounded-2xl p-5 border border-slate-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  document.status === 'ready'
                    ? 'hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md cursor-pointer group'
                    : 'opacity-80 cursor-default'
                }`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-blue-600 shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="overflow-hidden space-y-0.5">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate" title={document.originalName}>
                      {document.originalName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(document.fileSize)} • {document.pageCount || 0} pages
                    </p>
                    {document.status === 'failed' && document.processingError && (
                      <p className="text-xs text-red-600 font-medium pt-1">
                        Error: {document.processingError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  {getStatusBadge(document.status)}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (document.status === 'ready') navigate('/chat');
                      }}
                      disabled={document.status !== 'ready'}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all shadow-sm ${
                        document.status === 'ready'
                          ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-blue-600/20'
                          : 'bg-slate-300 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Start Q&A</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleDeleteDocument}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Really Works Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Brain className="h-3.5 w-3.5" />
              <span>Architecture & RAG Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How AskPDF AI Really Works
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Discover how our Retrieval-Augmented Generation (RAG) architecture processes your PDF documents securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pipelineSteps.map((stepItem, idx) => {
              const StepIcon = stepItem.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stepItem.color} flex items-center justify-center text-white shadow-sm`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <span className="text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                        {stepItem.step}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {stepItem.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {stepItem.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {stepItem.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Highlights Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/50">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Ready to query your PDF document?
            </h3>
            <p className="text-blue-200 text-xs sm:text-sm leading-relaxed">
              Upload your PDF above to extract key findings, summarize content, and receive instant citations.
            </p>
          </div>

          <button
            onClick={() => document && document.status === 'ready' ? navigate('/chat') : window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>{document && document.status === 'ready' ? 'Open Chat Interface' : 'Upload PDF Now'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
