import { apiClient } from './axios';

export interface BankAccount {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  upiId: string;
}

export interface Settlement {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  totalDeducted: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  bankAccountSnapshot: BankAccount | null;
  bankReferenceId: string | null;
  failureReason: string | null;
  initiatedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  metadata: any;
}

export interface AdminSettlement extends Settlement {
  partnerId: string;
  partner: { id: string; businessName: string; email: string };
}

// ── Partner endpoints ──

export const getBankAccount = async () => {
  const response = await apiClient.get('/api/v1/partners/partner/bank-account');
  return response.data as { success: boolean; data: { bankAccount: BankAccount | null; bankAccountVerified: boolean } };
};

export const updateBankAccount = async (bankAccount: Partial<BankAccount>) => {
  const response = await apiClient.patch('/api/v1/partners/partner/bank-account', bankAccount);
  return response.data as { success: boolean; data: { bankAccount: BankAccount; bankAccountVerified: boolean } };
};

export const requestSettlement = async (amount: number, reason?: string) => {
  const response = await apiClient.post('/api/v1/partners/partner/settlements/request', { amount, reason });
  return response.data as { success: boolean; data: { settlementId: string; requestedAmount: number; fee: number; totalDeducted: number; status: string; initiatedAt: string } };
};

export const getPartnerSettlementsList = async (
  page = 1,
  per = 20,
  filters?: { status?: string }
) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  if (filters?.status) params.set('status', filters.status);
  const response = await apiClient.get(`/api/v1/partners/partner/settlements?${params}`);
  return response.data as { success: boolean; data: Settlement[]; total: number; page: number; per: number };
};

// ── Admin endpoints ──

export const getAdminSettlements = async (
  page = 1,
  per = 50,
  filters?: { partnerId?: string; status?: string; from?: string; to?: string }
) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  if (filters?.partnerId) params.set('partnerId', filters.partnerId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const response = await apiClient.get(`/admin/reports/settlements?${params}`);
  return response.data as { data: AdminSettlement[]; total: number; page: number; per: number };
};

export const processSettlement = async (settlementId: string) => {
  const response = await apiClient.post(`/api/v1/settlements/${settlementId}/process`);
  return response.data;
};

export const completeSettlement = async (settlementId: string, bankReferenceId: string) => {
  const response = await apiClient.post(`/api/v1/settlements/${settlementId}/complete`, {
    result: 'SUCCESS',
    bankReferenceId,
  });
  return response.data;
};

export const failSettlement = async (settlementId: string, failureReason: string) => {
  const response = await apiClient.post(`/api/v1/settlements/${settlementId}/complete`, {
    result: 'FAILED',
    failureReason,
  });
  return response.data;
};
