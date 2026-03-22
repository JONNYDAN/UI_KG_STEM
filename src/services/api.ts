import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 120000);

const api = axios.create({
  baseURL: API_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0 ? API_TIMEOUT_MS : 120000,
});

export default api;