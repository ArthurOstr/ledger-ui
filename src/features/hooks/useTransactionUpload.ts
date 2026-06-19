import { useState, useEffect, useRef } from 'react';
import { uploadLedger, checkUploadStatus } from '@/api/client';

export type UploadState = 'IDLE' | 'UPLOADING' | 'POLLING' | 'SUCCESS' | 'FAILED';

export function useTransactionUpload(onUploadSuccess: () => void) {
  const [status, setStatus] = useState<UploadState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setStatus('UPLOADING');
      setErrorMessage(null);

      const response = await uploadLedger(file);

      setJobId(response.job_id);
      setStatus('POLLING');

    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.detail || 'Failed to reach service');
    }
  };

  useEffect(() => {
    if (status !== 'POLLING' || !jobId) return;

    const pollStatus = async () => {
      try {
        const data = await checkUploadStatus(jobId);

        if (data.status === 'SUCCESS' || data.status === 'complete') {
          stopPolling();
          setStatus('SUCCESS');
          onUploadSuccess();
        }
        else if (data.status === 'FAILED' || data.status === 'failed_or_expired') {
          stopPolling();
          setStatus('FAILED');
          setErrorMessage(data.error || 'The background worker failed to process the file');
        }
      } catch (error) {
        stopPolling();
        setStatus('FAILED');
        setErrorMessage('Lost connection to the polling server')
      }
    };

    pollingIntervalRef.current = window.setInterval(pollStatus, 2000);
    return () => stopPolling();
  }, [status, jobId, onUploadSuccess]);

  return { uploadFile, status, errorMessage, reset: () => setStatus('IDLE') };
}
