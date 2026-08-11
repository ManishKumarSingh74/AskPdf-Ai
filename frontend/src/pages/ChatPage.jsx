import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import PDFViewer from '../components/pdf/PDFViewer';
import ChatInterface from '../components/chat/ChatInterface';
import { documentApi } from '../services/documentApi';

export default function ChatPage() {
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    documentApi.getDocument().then((res) => {
      if (res.success && res.document) {
        setDocument(res.document);
      }
    });
  }, []);

  const handleCitationClick = ({ pageNumber }) => {
    if (pageNumber) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-white">
      <div className="flex-1 h-1/2 md:h-full min-w-0 flex flex-col border-r border-slate-200">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
            {document?.originalName || 'PDF Reader'}
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <PDFViewer
            fileUrl={document?.fileUrl}
            documentName={document?.originalName}
            currentPage={currentPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      <div className="w-full md:w-[420px] lg:w-[460px] h-1/2 md:h-full shrink-0">
        <ChatInterface onCitationClick={handleCitationClick} />
      </div>
    </div>
  );
}
