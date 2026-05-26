import { useState, useRef } from 'react';
import { uploadLedger, checkUploadStatus } from '../api/client';

interface Props {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- The Polling Loop
  const pollStatus = async (jobId: string) => {
    try {
      const { status } = await checkUploadStatus(jobId);

      if (status === 'complete') {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsUploading(false);
        onUploadSuccess();
      }
      else if (status === 'failed_or_expired') {
        setIsUploading(false);
        setError('The background worker failed to process the file');
      }
      else {
        // Status could be 'queued' or 'in_progress'
        setTimeout(() => pollStatus(jobId), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setError('Lost connection to the status broker');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset States 
    setIsUploading(true);
    setError(null);

    try {
      // drop the file to the Redis
      const response = await uploadLedger(file);

      // Start the polling loop with Redis receipt 
      pollStatus(response.job_id);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to reach the airlock')
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {error && <span className="text-sm text-red-600">{error}</span>}
      {isUploading && <span className="text-sm text-gray-500 animate-pulse">Processing vault insertion...</span>}

      <input
        type="file"
        accept=".xlsx, .xls"
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
