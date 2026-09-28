import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://askpdf-ai-bctu.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
