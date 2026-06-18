import { useState, useRef } from 'react';
import {  FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTransactionUpload } from '../features/hooks/useTransactionUpload';

interface Props {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: Props) {
  const { uploadFile, status, errorMessage, reset } = useTransactionUpload(onUploadSuccess);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Status mapping for visual components
  const renderContent = () => {
    switch (status) {
      case 'UPLOADING':
      case 'POLLING':
        return (
          <div className="flex flex-col items-center text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">
              {status === 'UPLOADING' ? 'Transmitting to proxy...' : 'Worker is parsing rows...'}
            </p>
          </div>
        );
      case 'SUCCESS':
        return (
          <div className="flex flex-col items-center text-green-600">
            <CheckCircle className="h-10 w-10 mb-4" />
            <p className="text-sm font-medium">Vault insertion complete.</p>
            <button onClick={reset} className="mt-4 text-xs underline hover:text-green-800">
              Upload another
            </button>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex flex-col items-center text-red-500">
            <AlertCircle className="h-10 w-10 mb-4" />
            <p className="text-sm font-medium">Pipeline Error</p>
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
            <button onClick={reset} className="mt-4 text-xs underline hover:text-red-700">
              Try again
            </button>
          </div>
        );
        case 'IDLE':
              default:
                return (
                  <div className="flex flex-col items-center text-gray-500">
                    {/* Swapping UploadCloud for FileSpreadsheet makes the domain explicit */}
                    <FileSpreadsheet className={`h-10 w-10 mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">
                      <span className="font-semibold text-gray-900">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">.XLSX or .XLS (Ledger Export)</p>
                  </div>
                );
              }
    }

  return (
  <div
      onClick={() => status === 'IDLE' && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-md p-8 border-2 border-dashed rounded-lg flex justify-center items-center transition-all duration-200 ease-in-out
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
        ${(status === 'UPLOADING' || status === 'POLLING') 
            ? 'cursor-wait pointer-events-none opacity-80' 
            : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {renderContent()}
    </div>
  );
}