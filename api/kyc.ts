import { apiClient } from './axios';
import { ApiResponse } from './types';

export interface KYCDocument {
  id: string;
  partnerId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type KYCDocumentType =
  | 'BUSINESS_REGISTRATION'
  | 'PAN_CARD'
  | 'GST_CERTIFICATE'
  | 'BANK_PROOF'
  | 'DIRECTOR_ID'
  | 'ADDRESS_PROOF';

// Partner: Upload KYC document
export const uploadKYCDocument = async (
  documentType: KYCDocumentType,
  file: File
): Promise<ApiResponse<KYCDocument>> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await apiClient.post<ApiResponse<KYCDocument>>(
    '/api/v1/partner/kyc-documents',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};

// Partner: Get own KYC documents
export const getPartnerKYCDocuments = async (): Promise<ApiResponse<KYCDocument[]>> => {
  const response = await apiClient.get<ApiResponse<KYCDocument[]>>(
    '/api/v1/partner/kyc-documents'
  );
  return response.data;
};

// Partner: Delete KYC document
export const deleteKYCDocument = async (documentId: string): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/v1/partner/kyc-documents/${documentId}`
  );
  return response.data;
};

// Admin KYC response with metadata
export interface KYCAdminMeta {
  allRequiredUploaded: boolean;
  missingTypes: string[];
  requiredCount: number;
  uploadedRequiredCount: number;
}

export interface KYCAdminResponse extends ApiResponse<KYCDocument[]> {
  meta?: KYCAdminMeta;
}

// Admin: Get partner's KYC documents
export const getPartnerKYCDocumentsAdmin = async (partnerId: string): Promise<KYCAdminResponse> => {
  const response = await apiClient.get<KYCAdminResponse>(
    `/api/v1/admin/partners/${partnerId}/kyc`
  );
  return response.data;
};

// Admin: Review (approve/reject) a KYC document
export const reviewKYCDocument = async (
  documentId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
): Promise<ApiResponse<KYCDocument>> => {
  const response = await apiClient.post<ApiResponse<KYCDocument>>(
    `/api/v1/admin/kyc-documents/${documentId}/review`,
    { status, rejectionReason }
  );
  return response.data;
};
