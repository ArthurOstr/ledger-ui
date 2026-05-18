import axios from 'axios';
import type { Transaction } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            window.location.href='/';
        }
        return Promise.reject(error);
    }
)

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get(`/transactions`);
  return response.data;
};

export default apiClient
