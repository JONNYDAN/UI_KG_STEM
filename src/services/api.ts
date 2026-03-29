import axios from 'axios';

const runtimeApiUrl =
  typeof window !== 'undefined' ? window.__ENV__?.VITE_API_URL || window.__ENV__?.VITE_API_BASE_URL : undefined;
const API_URL = runtimeApiUrl || import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 120000);

const api = axios.create({
  baseURL: API_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0 ? API_TIMEOUT_MS : 120000,
});

api.interceptors.request.use((requestConfig) => {
  const authToken = localStorage.getItem('authToken');

  if (authToken) {
    requestConfig.headers = requestConfig.headers || {};
    if (!requestConfig.headers.Authorization) {
      requestConfig.headers.Authorization = `Bearer ${authToken}`;
    }
  }

  return requestConfig;
});

export default api;
