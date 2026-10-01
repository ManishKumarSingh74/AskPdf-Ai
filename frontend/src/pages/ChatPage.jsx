import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatInterface from '../components/chat/ChatInterface';
import {
  ArrowLeft,
  FileText,
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Upload,
  Info,
  X,
  Download,
} from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get('/document')
      .then((res) => {
        if (res && res.success && res.document) {
          setDocument(res.document);
        } else {
          setDocument(null);
        }
      })
      .catch((err) => console.error('[Fetch Document Error]:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-600 text-xs font-semibold">Loading document & chat workspace...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-5 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900">No Document Active</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You need to upload a PDF document on the dashboard before starting the AI chat session.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Dashboard & Upload PDF</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100">
      {/* Top Document Header Bar */}
      <div className="bg-white px-4 py-2.5 border-b border-slate-200/90 flex items-center justify-between gap-4 shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            title="Click for Document Info"
          >
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="overflow-hidden space-y-0.5">
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={document.originalName}>
                {document.originalName}
              </h2>
            </div>
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>{document.pageCount || 0} Pages</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
            <span>{formatFileSize(document.fileSize)}</span>
          </div>

          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-colors"
              title="Open Raw Cloudinary PDF"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View PDF</span>
            </a>
          )}

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Change PDF</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Chat Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden max-w-4xl mx-auto w-full p-2 sm:p-4">
        <div className="h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/50 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Document Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Document Details</h3>
                  <p className="text-[11px] text-slate-500">Cloudinary & Vector Metadata</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Name</span>
                <p className="font-bold text-slate-800 break-all">{document.originalName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pages</span>
                  <p className="font-bold text-slate-800">{document.pageCount || 0} Pages</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Size</span>
                  <p className="font-bold text-slate-800">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Timestamp</span>
                <p className="font-medium text-slate-700">{formatDate(document.createdAt)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage ID</span>
                <p className="font-mono text-[11px] text-slate-600 truncate">{document.publicId || 'Cloudinary Asset'}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              {document.fileUrl && (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open PDF in Cloudinary</span>
                </a>
              )}
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
