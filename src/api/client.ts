import axios from 'axios';

// Configure the Base Client
const API_BASE_URL = import.meta.env.VITE_API_URL;;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// it runs before every request leaves the app
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getTransactions = async (limit = 50, offset = 0) => {
  const response = await apiClient.get(`/transactions?limit=${limit}&offset=${offset}`);
  return response.data;
};

export default apiClient
