import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  Landmark,
} from 'lucide-react';
import { getPlatformStats, getAdminTransactions, getPaywiseSettlements, type PlatformStats, type AdminTransaction, type PaywiseSettlementEntry } from '../../api/admin';
import AdminSettlementsSection from '../../components/AdminSettlementsSection';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);

const fmtShort = (v: number) =>
  v >= 10_00_000
    ? `₹${(v / 10_00_000).toFixed(2)}L`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(1)}K`
    : `₹${v.toFixed(2)}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  dark = false,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  dark?: boolean;
  accent?: string;
}) => (
  <div
    className={`rounded-3xl p-7 flex flex-col gap-4 ${
      dark ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-slate-900'
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${dark ? 'bg-[#1E293B]' : 'bg-slate-50'}`}>
        <Icon size={18} className={dark ? 'text-emerald-400' : accent || 'text-slate-500'} />
      </div>
    </div>
    <p className={`text-3xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    {sub && <p className={`text-xs font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
  </div>
);

const TxnStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    INITIATED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    REVERSED: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  };
  const c = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {status}
    </span>
  );
};

const PartnerStatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
    status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
  }`}>
    {status}
  </span>
);

// ─── main component ──────────────────────────────────────────────────────────

type Tab = 'overview' | 'transactions' | 'settlements' | 'partners' | 'paywise';

const AdminWalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(1);
  const [paywiseSettlements, setPaywiseSettlements] = useState<PaywiseSettlementEntry[]>([]);
  const [paywiseTotal, setPaywiseTotal] = useState(0);
  const [paywiseTotalSettled, setPaywiseTotalSettled] = useState(0);
  const [paywisePage, setPaywisePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, txnRes, pwRes] = await Promise.all([
          getPlatformStats(),
          getAdminTransactions(txnPage, 50),
          getPaywiseSettlements(paywisePage, 50),
        ]);
        if (cancelled) return;
        setPlatformStats(statsRes);
        setTransactions(txnRes.data);
        setTxnTotal(txnRes.total);
        setPaywiseSettlements(pwRes.data);
        setPaywiseTotal(pwRes.total);
        setPaywiseTotalSettled(pwRes.totalSettled);
      } catch (err: any) {
        if (!cancelled) {
          const errorMsg = typeof err?.message === 'string' ? err.message : 'Failed to load platform wallet data';
          setError(errorMsg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [txnPage, paywisePage, refreshKey]);

  const txnPages = Math.max(1, Math.ceil(txnTotal / 50));
  const paywisePages = Math.max(1, Math.ceil(paywiseTotal / 50));
  const t = platformStats?.transactions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
        <span className="ml-3 text-slate-500 font-semibold">Loading platform wallet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
        <p className="text-red-700 font-bold text-lg mb-4">{error}</p>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-8 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Platform Wallet</h1>
          <p className="text-slate-500 text-lg mt-1 font-medium">Commission earnings & partner wallet overview</p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Platform Wallet"
          value={fmtShort(platformStats?.platformWallet?.balance ?? 0)}
          sub="Total commission collected"
          icon={Wallet}
          dark
        />
        <StatCard
          label="Total Commission"
          value={fmtShort(t?.totalCommission ?? 0)}
          sub="Lifetime earned"
          icon={TrendingUp}
          accent="text-emerald-500"
        />
        <StatCard
          label="Total Volume"
          value={fmtShort(t?.totalVolume ?? 0)}
          sub="Gross transaction volume"
          icon={Activity}
          accent="text-blue-500"
        />
        <StatCard
          label="Active Partners"
          value={`${platformStats?.partners.active ?? 0} / ${platformStats?.partners.total ?? 0}`}
          sub="Active / Total partners"
          icon={Users}
          accent="text-slate-500"
        />
      </div>

      {/* Second row – transaction counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Successful Transactions"
          value={String(t?.successCount ?? 0)}
          sub="Completed payments"
          icon={CheckCircle2}
          accent="text-emerald-500"
        />
        <StatCard
          label="Pending Transactions"
          value={String(t?.pendingCount ?? 0)}
          sub="Awaiting completion"
          icon={Clock}
          accent="text-amber-500"
        />
        <StatCard
          label="Pending Settlements"
          value={fmtShort(platformStats?.pendingSettlements.amount ?? 0)}
          sub={`${platformStats?.pendingSettlements.count ?? 0} settlements pending`}
          icon={DollarSign}
          accent="text-amber-500"
        />
        <StatCard
          label="Paywise Settled to Bank"
          value={fmtShort(paywiseTotalSettled)}
          sub={`${paywiseTotal} payout${paywiseTotal !== 1 ? 's' : ''} received`}
          icon={Landmark}
          accent="text-violet-500"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(['overview', 'transactions', 'settlements', 'partners', 'paywise'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'overview'
                ? 'Financial Breakdown'
                : tab === 'transactions'
                ? `All Transactions (${txnTotal})`
                : tab === 'settlements'
                ? `Settlements (${platformStats?.pendingSettlements.count ?? 0})`
                : tab === 'partners'
                ? `Partner Wallets (${platformStats?.partnerWallets.length ?? 0})`
                : `Paywise Payouts (${paywiseTotal})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-8 space-y-5">
            <div className="space-y-4">
              {[
                { label: 'Gross Transaction Volume', value: t?.totalVolume ?? 0, color: 'text-blue-600' },
                { label: 'Platform Commission Earned', value: t?.totalCommission ?? 0, color: 'text-emerald-600', bold: true },
                { label: 'Total Transactions', value: t?.totalCount ?? 0, isCount: true, color: 'text-slate-700' },
                { label: 'Successful', value: t?.successCount ?? 0, isCount: true, color: 'text-emerald-600' },
                { label: 'Pending', value: t?.pendingCount ?? 0, isCount: true, color: 'text-amber-600' },
                { label: 'Failed', value: t?.failedCount ?? 0, isCount: true, color: 'text-red-600' },
              ].map(({ label, value, color, bold, isCount }) => (
                <div key={label} className="flex justify-between items-center">
                  <p className={`text-sm font-${bold ? 'bold' : 'medium'} text-slate-${bold ? '900' : '500'}`}>{label}</p>
                  <p className={`text-sm font-bold tabular-nums ${color}`}>
                    {isCount ? value : fmt(value as number)}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-px bg-slate-100" />
            <div className="p-5 bg-slate-900 rounded-2xl text-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Platform Commission Wallet</p>
              <p className="text-3xl font-bold">{fmt(platformStats?.platformWallet?.balance ?? 0)}</p>
              <p className="text-xs text-slate-500 mt-2">{platformStats?.platformWallet?.currency ?? 'INR'} • Accumulated commissions</p>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 font-black">
                      <th className="pb-5 px-6 pt-6">Transaction ID</th>
                      <th className="pb-5 px-4 pt-6">Partner</th>
                      <th className="pb-5 px-4 pt-6">Status</th>
                      <th className="pb-5 px-4 pt-6 text-right">Amount</th>
                      <th className="pb-5 px-4 pt-6 text-right">Commission</th>
                      <th className="pb-5 px-4 pt-6 text-right">Net</th>
                      <th className="pb-5 px-4 pt-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 text-xs font-mono">{txn.id.slice(0, 12)}…</p>
                        </td>
                        <td className="py-5 px-4 text-xs font-bold text-slate-600">
                          {txn.partner?.businessName || txn.partnerId?.slice(0, 8) || '—'}
                        </td>
                        <td className="py-5 px-4"><TxnStatusBadge status={txn.status} /></td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 tabular-nums">{fmt(txn.amount)}</td>
                        <td className="py-5 px-4 text-right font-medium text-emerald-600 tabular-nums text-sm">{fmt(txn.commission)}</td>
                        <td className="py-5 px-4 text-right font-bold text-slate-700 tabular-nums">{fmt(txn.netAmount)}</td>
                        <td className="py-5 px-4 text-xs text-slate-400">{fmtDate(txn.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {txnPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button
                  disabled={txnPage <= 1}
                  onClick={() => setTxnPage(p => p - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">Page {txnPage} of {txnPages}</span>
                <button
                  disabled={txnPage >= txnPages}
                  onClick={() => setTxnPage(p => p + 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <div className="p-6">
            <AdminSettlementsSection />
          </div>
        )}

        {/* Partner Wallets Tab */}
        {activeTab === 'partners' && (
          <div>
            {!platformStats?.partnerWallets || platformStats.partnerWallets.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">No partner wallets found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 font-black">
                      <th className="pb-5 px-6 pt-6">Partner</th>
                      <th className="pb-5 px-4 pt-6">Status</th>
                      <th className="pb-5 px-4 pt-6 text-right">Wallet Balance</th>
                      <th className="pb-5 px-4 pt-6 text-right">Commission Rate</th>
                      <th className="pb-5 px-4 pt-6">Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {platformStats.partnerWallets.map(w => (
                      <tr key={w.walletId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 text-sm">{w.businessName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{w.partnerId.slice(0, 12)}…</p>
                        </td>
                        <td className="py-5 px-4"><PartnerStatusBadge status={w.partnerStatus} /></td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 tabular-nums text-lg">
                          {fmt(w.balance)}
                        </td>
                        <td className="py-5 px-4 text-right">
                          <span className="text-sm font-bold text-slate-700">{(w.commissionRate * 100).toFixed(2)}%</span>
                        </td>
                        <td className="py-5 px-4 text-xs font-bold text-slate-400">{w.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Paywise Payouts Tab */}
        {activeTab === 'paywise' && (
          <div>
            {/* Summary banner */}
            <div className="mx-6 mt-6 p-5 bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Landmark size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Total Paywise Settled to Bank</p>
                  <p className="text-2xl font-bold text-violet-900">{fmt(paywiseTotalSettled)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-violet-500 font-medium">{paywiseTotal} payout event{paywiseTotal !== 1 ? 's' : ''} logged</p>
                <p className="text-[10px] text-violet-400 mt-0.5">Paywise → Paycher's bank account</p>
              </div>
            </div>

            {paywiseSettlements.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">
                <Landmark size={40} className="mx-auto mb-4 text-slate-300" />
                <p>No Paywise payouts recorded yet.</p>
                <p className="text-xs mt-2 text-slate-300">Payouts will appear here once Paywise settles funds to your bank account.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 font-black">
                      <th className="pb-5 px-6 pt-4">Paywise Reference</th>
                      <th className="pb-5 px-4 pt-4">Description</th>
                      <th className="pb-5 px-4 pt-4 text-right">Amount</th>
                      <th className="pb-5 px-4 pt-4">Received At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paywiseSettlements.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 text-xs font-mono">{entry.paywiseSettlementId.slice(0, 20)}{entry.paywiseSettlementId.length > 20 ? '…' : ''}</p>
                        </td>
                        <td className="py-5 px-4 text-xs text-slate-600 max-w-xs">
                          <p className="truncate">{entry.description || '—'}</p>
                        </td>
                        <td className="py-5 px-4 text-right font-bold text-violet-700 tabular-nums text-sm">
                          {fmt(entry.amount)}
                        </td>
                        <td className="py-5 px-4 text-xs text-slate-400">{fmtDate(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {paywisePages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button
                  disabled={paywisePage <= 1}
                  onClick={() => setPaywisePage(p => p - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">Page {paywisePage} of {paywisePages}</span>
                <button
                  disabled={paywisePage >= paywisePages}
                  onClick={() => setPaywisePage(p => p + 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletPage;
