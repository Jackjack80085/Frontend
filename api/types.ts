// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PartnerData {
  id: string;
  email: string;
  businessName: string;
  status: string;
  kycStatus: string;
}

export interface LoginResponse {
  admin?: AdminData;
  partner?: PartnerData;
  token: string;
}
