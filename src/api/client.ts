import axios from 'axios';

// Define the Interface 
export interface Transaction {
  id: number;
  date: string;
  category: string | null;
  card: string | null;
  description: string | null;
  amount: number;
  currency: string;
  balance_after: number;
  balance_currency: string;
  transaction_currency: string;
  transaction_amount: number;
  created_at: string;
}

// Configure the Base Client
const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The Fetcher
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<Transaction[]>('/api/transactions');
  return response.data;
};
