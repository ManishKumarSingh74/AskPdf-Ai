import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PDFViewer from '../components/pdf/PDFViewer';
import ChatInterface from '../components/chat/ChatInterface';

export default function ChatPage() {
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.get('/document').then((res) => {
      if (res && res.success && res.document) {
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
