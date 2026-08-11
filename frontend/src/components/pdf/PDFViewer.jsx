import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer({ fileUrl, documentName, currentPage = 1, onPageChange }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentPage && currentPage !== pageNumber) {
      setPageNumber(currentPage);
    }
  }, [currentPage]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error('[PDF Load Error]:', err);
    setError('Failed to load PDF document.');
  };

  const handlePageChange = (newPage) => {
    const validPage = Math.min(Math.max(1, newPage), numPages || 1);
    setPageNumber(validPage);
    if (onPageChange) onPageChange(validPage);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const resetZoom = () => setScale(1.0);

  return (
    <div className="flex flex-col h-full bg-slate-100 border-x border-slate-200 relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 text-xs shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden max-w-[200px] sm:max-w-xs">
          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-800 truncate" title={documentName || 'Document'}>
            {documentName || 'PDF Reader'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-slate-700 font-semibold px-1">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100" title="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetZoom} className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium rounded hover:bg-slate-100">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={zoomIn} className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100" title="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {fileUrl && (
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 ml-1"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-100 custom-scrollbar">
        {!fileUrl ? (
          <div className="my-auto text-center p-8 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Select a PDF to preview.</p>
          </div>
        ) : error ? (
          <div className="my-auto text-center p-8 text-red-600 flex flex-col items-center gap-2">
            <AlertCircle className="h-7 w-7" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="my-auto text-center p-8 text-blue-600 flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm font-medium">Loading PDF...</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-md rounded border border-slate-200 overflow-hidden"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
