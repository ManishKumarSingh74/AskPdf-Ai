import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Trash2, MessageSquare, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import DocumentUploader from '../components/document/DocumentUploader';

export default function Dashboard() {
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/document');
      if (res.data.success && res.data.document) {
        setDocument(res.data.document);
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
      await axios.delete('/api/document');
      setDocument(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete document');
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
          <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready for Q&A</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Processing PDF...</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Uploading</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-200 pb-6 text-center sm:text-left">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
          AskPDF <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Upload your single PDF and ask questions using Gemini RAG.
        </p>
      </div>

      <DocumentUploader onUploadSuccess={handleUploadSuccess} />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Active PDF Document
        </h2>

        {isLoading ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
            <Loader2 className="h-7 w-7 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-600 text-xs font-medium">Checking active document...</p>
          </div>
        ) : !document ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">No PDF uploaded yet</p>
            <p className="text-slate-500 text-xs mt-1">Upload a PDF file above to start asking questions.</p>
          </div>
        ) : (
          <div
            onClick={() => document.status === 'ready' && navigate('/chat')}
            className={`bg-white rounded-xl p-6 border border-slate-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              document.status === 'ready' ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : 'opacity-80 cursor-default'
            }`}
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                <FileText className="h-8 w-8" />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-base text-slate-900 truncate" title={document.originalName}>
                  {document.originalName}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {formatFileSize(document.fileSize)} • {document.pageCount || 0} pages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              {getStatusBadge(document.status)}

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (document.status === 'ready') navigate('/chat');
                  }}
                  disabled={document.status !== 'ready'}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors shadow-sm ${
                    document.status === 'ready'
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask Questions
                </button>

                <button
                  onClick={handleDeleteDocument}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
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
  );
}
