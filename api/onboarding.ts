import { apiClient } from './axios';
import { ApiResponse } from './types';

export interface VerifyInviteResponse {
  businessName: string;
  email: string;
  phone?: string;
}

export interface CompleteRegistrationRequest {
  token: string;
  password: string;
  phone?: string;
}

export interface CompleteRegistrationResponse {
  partnerId: string;
  email: string;
  businessName: string;
}

// Verify invite token (no auth needed)
export const verifyInviteToken = async (token: string): Promise<ApiResponse<VerifyInviteResponse>> => {
  const response = await apiClient.get<ApiResponse<VerifyInviteResponse>>(
    `/api/v1/onboarding/verify-invite/${token}`
  );
  return response.data;
};

// Complete registration (no auth needed)
export const completeRegistration = async (data: CompleteRegistrationRequest): Promise<ApiResponse<CompleteRegistrationResponse>> => {
  const response = await apiClient.post<ApiResponse<CompleteRegistrationResponse>>(
    '/api/v1/onboarding/complete-registration',
    data
  );
  return response.data;
};
