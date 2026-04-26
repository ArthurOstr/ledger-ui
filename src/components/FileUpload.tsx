import { useState, useRef } from 'react';
import axios from 'axios';

interface Props {
  onUploadSucess: () => void;
}

export default function FileUpload({ onUploadSucess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset States 
    setIsUploading(true);
    setError(null);

    // Pack the payload (multipart/form-data)
    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST reqyest to Back-end
      await axios.post('http://127.0.0.1:8000/api/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Clear the input. Refresh the page 
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSucess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed  to upload the ledger.');
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="flex items-center space-x-4">
      {error && <span className="text-sm text-red-600">{error}</span>}
      {isUploading && <span className="text-sm text-gray-500 animate-pulse">Processing vault insertion...</span>}

      <input
        type="file"
        accept=".xlsx"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        Upload Excel
      </button>
    </div>
  );
}
