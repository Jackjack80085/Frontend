import { apiClient } from './axios';

export interface PlatformStats {
  partners: { total: number; active: number };
  platformWallet: { id: string; balance: number; currency: string } | null;
  transactions: {
    totalCount: number;
    totalVolume: number;
    totalCommission: number;
    pendingCount: number;
    successCount: number;
    failedCount: number;
  };
  pendingSettlements: { count: number; amount: number };
  partnerWallets: {
    walletId: string;
    partnerId: string;
    businessName: string;
    partnerStatus: string;
    balance: number;
    currency: string;
    commissionRate: number;
  }[];
}

export interface AdminTransaction {
  id: string;
  partnerId: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: string;
  paymentMethod: string;
  userReference: string;
  createdAt: string;
  completedAt: string | null;
  partner: { id: string; businessName: string };
}

export const getPlatformStats = async (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const response = await apiClient.get(`/admin/reports/platform-stats${qs ? '?' + qs : ''}`);
  return response.data as PlatformStats;
};

export interface PaywiseSettlementEntry {
  id: string;
  paywiseSettlementId: string;
  amount: number;
  description: string;
  createdAt: string;
}

export const getPaywiseSettlements = async (page = 1, per = 50) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  const response = await apiClient.get(`/admin/reports/paywise-settlements?${params}`);
  const result = response.data as {
    data: PaywiseSettlementEntry[];
    total: number;
    totalSettled: number;
    page: number;
    per: number;
  };
  return result;
};

export const getAdminTransactions = async (
  page = 1,
  per = 50,
  filters?: { partnerId?: string; status?: string; from?: string; to?: string }
) => {
  const params = new URLSearchParams({ page: String(page), per: String(per) });
  if (filters?.partnerId) params.set('partnerId', filters.partnerId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const response = await apiClient.get(`/admin/reports/transactions?${params}`);
  const result = response.data as { data: any[]; total: number; page: number; per: number };
  result.data = result.data.map(t => ({
    ...t,
    amount: parseFloat(t.amount?.toString() || '0'),
    commission: parseFloat(t.commission?.toString() || '0'),
    netAmount: parseFloat(t.netAmount?.toString() || '0'),
  }));
  return result as { data: AdminTransaction[]; total: number; page: number; per: number };
};
