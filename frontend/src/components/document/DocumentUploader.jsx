import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { Upload, FileText, AlertTriangle, Loader2, X } from 'lucide-react';

export default function DocumentUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    setErrorMessage(null);
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage(`"${file.name}" is not a PDF file. Only PDF files are allowed.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(`"${file.name}" exceeds the 50MB size limit.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (data && data.success && onUploadSuccess) {
        onUploadSuccess(data.document);
      }
    } catch (error) {
      console.error('[Upload Error]:', error);
      setErrorMessage(error.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`bg-white rounded-2xl p-8 border-2 border-dashed transition-all text-center cursor-pointer relative shadow-sm ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
        }`}
      >
        <div className="mx-auto w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600">
          {isUploading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>

        <h3 className="text-base font-bold text-slate-800">
          {isUploading ? 'Uploading PDF...' : 'Upload PDF Document'}
        </h3>

        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {isUploading
            ? 'Preparing document for AI indexing...'
            : 'Drag and drop your single PDF file here, or click to select from your computer.'}
        </p>

        {isUploading && (
          <div className="mt-4 max-w-xs mx-auto space-y-2">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-blue-600">{uploadProgress}% Uploaded</p>
          </div>
        )}

        {!isUploading && (
          <div className="mt-5">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileText className="h-4 w-4" />
              Select PDF File
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple={false}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
