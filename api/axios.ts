import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = (((import.meta as any).env && (import.meta as any).env.VITE_API_URL) as string) || 'http://localhost:5000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Normalize server error messages into a client-friendly place so UI can show readable text
    try {
      const respData = (error.response && (error.response.data as any)) || {};
      const serverMessage = respData.message || respData.error?.message || respData.error?.details?.message || error.message;
      // attach normalized message
      if (error.response) {
        (error.response.data as any)._clientMessage = serverMessage;
        const retryAfterHeader = (error.response.headers as any)?.['retry-after'];
        if (retryAfterHeader) {
          (error.response.data as any)._retryAfter = retryAfterHeader;
        } else if (respData.error?.details?.retryAfter) {
          (error.response.data as any)._retryAfter = respData.error.details.retryAfter;
        }
      }

      // Also set error.message so code that reads err.message gets useful text
      (error as any).message = serverMessage;
    } catch (e) {
      // ignore normalization errors
    }

    if (error.response?.status === 401) {
      // Only clear auth for token-related failures (expired/invalid JWT),
      // not for endpoint-specific permission errors
      const respData = (error.response.data as any) || {};
      const errCode = respData.error?.code || '';
      const errMsg = respData.message || respData.error?.message || '';
      const isTokenError = errCode === 'UNAUTHORIZED' || /expired|invalid token/i.test(errMsg);

      if (isTokenError) {
        console.warn('Unauthorized (token invalid/expired) - clearing auth data');
        storage.clear();
        try {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        } catch (e) {
          // ignore if CustomEvent is unavailable
        }
      } else {
        console.warn('401 response but not a token error, keeping session:', errMsg);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
