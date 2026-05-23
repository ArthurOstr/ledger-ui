import axios from 'axios';
import type { Transaction } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
    withCredentials: true,
});

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get(`/transactions`);
  return response.data;
};

export default apiClient
