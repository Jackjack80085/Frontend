import { apiClient } from './axios';
import { ApiResponse } from './types';

export interface InvitePartnerRequest {
  businessName: string;
  email: string;
  phone?: string;
  businessType?: string;
}

export interface InvitePartnerResponse {
  partnerId: string;
  email: string;
  inviteLink: string;
  expiresAt: string;
}

export interface Partner {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  status: string;
  kycStatus: string;
  createdAt: string;
}

// Update current partner profile (partner self-service)
export const updatePartnerProfile = async (data: Partial<Partner>): Promise<ApiResponse<Partner>> => {
  const response = await apiClient.patch<ApiResponse<Partner>>('/api/v1/partners/partner', data);
  return response.data;
};

// Upload profile image for current partner
// (profile image upload removed)

// Change partner password (current password + new password)
export const changePartnerPassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
  const response = await apiClient.post<ApiResponse<void>>('/api/v1/partners/partner/change-password', { currentPassword, newPassword });
  return response.data;
};

// Get current partner profile (self)
export const getPartnerProfile = async (): Promise<ApiResponse<Partner>> => {
  const response = await apiClient.get<ApiResponse<Partner>>('/api/v1/partners/partner');
  return response.data;
};

// Invite new partner
export const invitePartner = async (data: InvitePartnerRequest): Promise<ApiResponse<InvitePartnerResponse>> => {
  const response = await apiClient.post<ApiResponse<InvitePartnerResponse>>(
    '/api/v1/admin/partners/invite',
    data
  );
  return response.data;
};

// Get all partners
export const getAllPartners = async (): Promise<ApiResponse<Partner[]>> => {
  const response = await apiClient.get<ApiResponse<Partner[]>>('/api/v1/admin/partners');
  return response.data;
};

// Get partner by ID
export const getPartnerById = async (partnerId: string): Promise<ApiResponse<Partner>> => {
  const response = await apiClient.get<ApiResponse<Partner>>(`/api/v1/admin/partners/${partnerId}`);
  return response.data;
};

// API Credentials types
export interface ApiCredentials {
  apiKey: string;
  apiSecret?: string;
  apiKeyVersion: number;
  apiKeyActiveFrom: string;
  webhookUrl?: string;
  commissionRate: number;
}

export interface ApiKeyHistory {
  version: number;
  rotatedAt: string;
  reason?: string;
  rotatedBy: string;
}

// Get current API credentials
export const getApiCredentials = async (): Promise<ApiResponse<ApiCredentials>> => {
  const response = await apiClient.get<ApiResponse<ApiCredentials>>(
    '/api/v1/partner/api-credentials'
  );
  return response.data;
};

// Rotate API key
export const rotateApiKey = async (reason?: string): Promise<ApiResponse<ApiCredentials>> => {
  const response = await apiClient.post<ApiResponse<ApiCredentials>>(
    '/api/v1/partner/rotate-api-key',
    { reason }
  );
  return response.data;
};

// Get rotation history
export const getApiKeyHistory = async (): Promise<ApiResponse<ApiKeyHistory[]>> => {
  const response = await apiClient.get<ApiResponse<ApiKeyHistory[]>>(
    '/api/v1/partner/api-key-history'
  );
  return response.data;
};

// Update webhook URL
export const updateWebhookUrl = async (webhookUrl: string): Promise<ApiResponse<void>> => {
  const response = await apiClient.patch<ApiResponse<void>>(
    '/api/v1/partner/webhook',
    { webhookUrl }
  );
  return response.data;
};
