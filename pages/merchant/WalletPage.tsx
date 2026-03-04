import React, { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  Wallet,
} from 'lucide-react';
import {
  getPartnerEarnings,
  getPartnerTransactions,
  getPartnerSettlements,
  type EarningsSummary,
  type PartnerTransaction,
  type Settlement,
} from '../../api/wallet';
import SettlementRequestModal from '../../components/SettlementRequestModal';

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
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
        {label}
      </p>
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

const SettlementStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string; border: string; Icon: React.ElementType }> = {
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', Icon: Clock },
    PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', Icon: RefreshCw },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', Icon: XCircle },
  };
  const c = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
      <c.Icon size={10} />
      {status}
    </span>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

type Tab = 'overview' | 'transactions' | 'settlements';

const MerchantWalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(1);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [setlTotal, setSetlTotal] = useState(0);
  const [setlPage, setSetlPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [earningsRes, txnRes, setlRes] = await Promise.all([
          getPartnerEarnings(),
          getPartnerTransactions(txnPage, 20),
          getPartnerSettlements(setlPage, 20),
        ]);
        if (cancelled) return;
        setEarnings(earningsRes.summary);
        setTransactions(txnRes.data);
        setTxnTotal(txnRes.total);
        setSettlements(setlRes.data);
        setSetlTotal(setlRes.total);
      } catch (err: any) {
        if (!cancelled) {
          const errorMsg = typeof err?.message === 'string' ? err.message : 'Failed to load wallet data';
          setError(errorMsg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [txnPage, setlPage, refreshKey]);

  const txnPages = Math.max(1, Math.ceil(txnTotal / 20));
  const setlPages = Math.max(1, Math.ceil(setlTotal / 20));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
        <span className="ml-3 text-slate-500 font-semibold">Loading wallet...</span>
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
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Wallet</h1>
          <p className="text-slate-500 text-lg mt-1 font-medium">Earnings, balances & withdrawal history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Wallet size={15} />
            Withdraw Funds
          </button>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <SettlementRequestModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Available Balance"
          value={fmtShort(earnings?.availableBalance ?? 0)}
          sub="Ready to withdraw"
          icon={DollarSign}
          dark
        />
        <StatCard
          label="Current Balance"
          value={fmtShort(earnings?.currentBalance ?? 0)}
          sub="Total net earnings"
          icon={TrendingUp}
          accent="text-emerald-500"
        />
        <StatCard
          label="Total Payin"
          value={fmtShort(earnings?.totalPayin ?? 0)}
          sub="Gross received"
          icon={ArrowDownLeft}
          accent="text-blue-500"
        />
        <StatCard
          label="Total Commission"
          value={fmtShort(earnings?.totalCommission ?? 0)}
          sub="Platform fee deducted"
          icon={TrendingDown}
          accent="text-amber-500"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Net Earnings"
          value={fmtShort(earnings?.totalEarned ?? 0)}
          sub="After commission"
          icon={TrendingUp}
          accent="text-emerald-500"
        />
        <StatCard
          label="Total Withdrawn"
          value={fmtShort(earnings?.totalWithdrawn ?? 0)}
          sub="Settled to bank"
          icon={ArrowUpRight}
          accent="text-slate-500"
        />
        <StatCard
          label="Pending Settlements"
          value={fmtShort(earnings?.pendingSettlements ?? 0)}
          sub="Awaiting processing"
          icon={Clock}
          accent="text-amber-500"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(['overview', 'transactions', 'settlements'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                activeTab === t
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t === 'overview' ? 'Summary' : t === 'transactions' ? `Transactions (${txnTotal})` : `Settlements (${setlTotal})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Success Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{earnings?.successTransactions ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pending Transactions</p>
                <p className="text-2xl font-bold text-amber-600">{earnings?.pendingTransactions ?? 0}</p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-4">
              {[
                { label: 'Total Payin (Gross)', value: earnings?.totalPayin ?? 0, color: 'text-blue-600' },
                { label: 'Platform Commission', value: -(earnings?.totalCommission ?? 0), color: 'text-amber-600' },
                { label: 'Net Earnings', value: earnings?.totalEarned ?? 0, color: 'text-emerald-600', bold: true },
                { label: 'Withdrawals Made', value: -(earnings?.totalWithdrawn ?? 0), color: 'text-slate-500' },
                { label: 'Current Wallet Balance', value: earnings?.currentBalance ?? 0, color: 'text-slate-900', bold: true },
                { label: 'Pending Settlements (on hold)', value: -(earnings?.pendingSettlements ?? 0), color: 'text-amber-600' },
                { label: 'Available to Withdraw', value: earnings?.availableBalance ?? 0, color: 'text-emerald-600', bold: true },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className={`flex justify-between items-center ${bold ? 'py-1' : ''}`}>
                  <p className={`text-sm font-${bold ? 'bold' : 'medium'} text-slate-${bold ? '900' : '500'}`}>{label}</p>
                  <p className={`text-sm font-bold tabular-nums ${color}`}>
                    {value < 0 ? `- ${fmt(-value)}` : fmt(value)}
                  </p>
                </div>
              ))}
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
                      <th className="pb-5 px-6 pt-6">ID</th>
                      <th className="pb-5 px-4 pt-6">Method</th>
                      <th className="pb-5 px-4 pt-6">Status</th>
                      <th className="pb-5 px-4 pt-6 text-right">Amount</th>
                      <th className="pb-5 px-4 pt-6 text-right">Commission</th>
                      <th className="pb-5 px-4 pt-6 text-right">Net</th>
                      <th className="pb-5 px-4 pt-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 text-xs font-mono">{t.id.slice(0, 12)}…</p>
                          {t.userReference && <p className="text-[10px] text-slate-400 mt-0.5">{t.userReference}</p>}
                        </td>
                        <td className="py-5 px-4 text-xs font-bold text-slate-500">{t.paymentMethod || '—'}</td>
                        <td className="py-5 px-4"><TxnStatusBadge status={t.status} /></td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 tabular-nums">{fmt(t.amount)}</td>
                        <td className="py-5 px-4 text-right font-medium text-amber-600 tabular-nums text-sm">{fmt(t.commission)}</td>
                        <td className="py-5 px-4 text-right font-bold text-emerald-700 tabular-nums">{fmt(t.netAmount)}</td>
                        <td className="py-5 px-4 text-xs text-slate-400">{fmtDate(t.createdAt)}</td>
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
          <div>
            {settlements.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">No settlements yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 font-black">
                      <th className="pb-5 px-6 pt-6">Settlement ID</th>
                      <th className="pb-5 px-4 pt-6">Status</th>
                      <th className="pb-5 px-4 pt-6 text-right">Amount</th>
                      <th className="pb-5 px-4 pt-6 text-right">Fee</th>
                      <th className="pb-5 px-4 pt-6 text-right">Net Paid</th>
                      <th className="pb-5 px-4 pt-6">Created</th>
                      <th className="pb-5 px-4 pt-6">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {settlements.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 text-xs font-mono">{s.id.slice(0, 12)}…</p>
                          {s.reference && <p className="text-[10px] text-slate-400 mt-0.5">{s.reference}</p>}
                        </td>
                        <td className="py-5 px-4"><SettlementStatusBadge status={s.status} /></td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 tabular-nums">{fmt(s.amount)}</td>
                        <td className="py-5 px-4 text-right text-sm font-medium text-amber-600 tabular-nums">{fmt(s.fee)}</td>
                        <td className="py-5 px-4 text-right font-bold text-emerald-700 tabular-nums">{fmt(s.netAmount)}</td>
                        <td className="py-5 px-4 text-xs text-slate-400">{fmtDate(s.createdAt)}</td>
                        <td className="py-5 px-4 text-xs text-slate-400">{s.completedAt ? fmtDate(s.completedAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {setlPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button
                  disabled={setlPage <= 1}
                  onClick={() => setSetlPage(p => p - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">Page {setlPage} of {setlPages}</span>
                <button
                  disabled={setlPage >= setlPages}
                  onClick={() => setSetlPage(p => p + 1)}
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

export default MerchantWalletPage;
