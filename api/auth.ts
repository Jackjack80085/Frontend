import apiClient from './axios';
import { ApiResponse, LoginResponse } from './types';

export interface LoginRequest {
  email: string;
  password: string;
}

export const adminLogin = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/admin/login', credentials);
  return response.data;
};

export const partnerLogin = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/partner/login', credentials);
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await apiClient.get('/auth/admin/me');
  return response.data;
};

export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
