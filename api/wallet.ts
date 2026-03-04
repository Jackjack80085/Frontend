import { apiClient } from './axios';

export interface EarningsSummary {
  totalEarned: number;
  totalWithdrawn: number;
  currentBalance: number;
  pendingSettlements: number;
  availableBalance: number;
  totalPayin: number;
  totalCommission: number;
  pendingTransactions: number;
  successTransactions: number;
}

export interface PartnerTransaction {
  id: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: string;
  paymentMethod: string;
  userReference: string;
  createdAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface Settlement {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  totalDeducted: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  reference: string | null;
}

export const getPartnerEarnings = async (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const response = await apiClient.get(`/partner/reports/earnings${qs ? '?' + qs : ''}`);
  return response.data as { summary: EarningsSummary; breakdown: any[] };
};

export const getPartnerTransactions = async (
  page = 1,
  per = 20,
  filters?: { status?: string; from?: string; to?: string }
) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const response = await apiClient.get(`/partner/reports/transactions?${params}`);
  const result = response.data as { data: any[]; total: number; page: number; per: number };
  result.data = result.data.map(t => ({
    ...t,
    amount: parseFloat(t.amount?.toString() || '0'),
    commission: parseFloat(t.commission?.toString() || '0'),
    netAmount: parseFloat(t.netAmount?.toString() || '0'),
  }));
  return result as { data: PartnerTransaction[]; total: number; page: number; per: number };
};

export const getPartnerSettlements = async (
  page = 1,
  per = 20,
  filters?: { status?: string; from?: string; to?: string }
) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const response = await apiClient.get(`/partner/reports/settlements?${params}`);
  const result = response.data as { data: any[]; total: number; page: number; per: number };
  result.data = result.data.map(s => ({
    ...s,
    amount: parseFloat(s.amount?.toString() || '0'),
    fee: parseFloat(s.fee?.toString() || '0'),
    netAmount: parseFloat(s.netAmount?.toString() || '0'),
    totalDeducted: parseFloat(s.totalDeducted?.toString() || '0'),
  }));
  return result as { data: Settlement[]; total: number; page: number; per: number };
};
