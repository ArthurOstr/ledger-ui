import axios from 'axios';
import type { Transaction, UploadResponse, StatusResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get(`/transactions`);
  return response.data;
};

export const uploadLedger = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/transactions/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const checkUploadStatus = async (jobId: string): Promise<StatusResponse> => {
  const response = await apiClient.get(`/transactions/status/${jobId}`);
  return response.data;
};

export default apiClient
