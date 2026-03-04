import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Download,
  Upload,
  PauseCircle,
  AlertCircle,
  MoreVertical,
  DollarSign,
  Store,
} from 'lucide-react';
import { getPlatformStats, getAdminTransactions, type PlatformStats, type AdminTransaction } from '../../api/admin';
import AdminWalletPage from './WalletPage';
import MerchantPage from './MerchantPage';

// --- Types ---
type TransactionStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
type TimePeriod = 'DAYS' | 'MONTHS' | 'YEARS';

const STATUS_CONFIG: Record<TransactionStatus, { color: string; bg: string; border: string }> = {
  SUCCESS: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  FAILED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  INITIATED: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  REVERSED: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
};

// --- Shared Sub-components ---

const StatusBadge = ({ status }: { status: TransactionStatus }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase border ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].border}`}>
    <span className={`w-1 h-1 rounded-full ${status === 'PENDING' ? 'animate-pulse' : ''} bg-current`}></span>
    {status}
  </span>
);

const Card = ({ title, children, subtitle }: { title?: string; children?: React.ReactNode; subtitle?: string }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
    {title && (
      <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
        <button className="text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={16} /></button>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const OverviewCard = ({ title, subtitle, label, value, icon: Icon, colorClass, iconBgClass, isLight = false }: {
  title?: string; subtitle?: string; label: string; value: string;
  icon: any; colorClass: string; iconBgClass: string; isLight?: boolean;
}) => {
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subTextColor = isLight ? 'text-slate-400' : 'text-white/40';
  const dividerColor = isLight ? 'bg-slate-100' : 'bg-white/10';
  const moreColor = isLight ? 'text-slate-300 hover:text-slate-600' : 'text-white/30 hover:text-white';
  const iconColor = isLight ? 'text-slate-600' : 'text-white';
  return (
    <div className={`${colorClass} rounded-[1.5rem] overflow-hidden shadow-xl transition-all hover:scale-[1.01] duration-300 flex flex-col border ${isLight ? 'border-slate-100' : 'border-transparent'}`}>
      <div className="px-7 py-4 flex justify-between items-start">
        <div className="min-h-[2rem]">
          {title && <h4 className={`${textColor} font-bold text-lg tracking-tight leading-tight`}>{title}</h4>}
          {subtitle && <p className={`${subTextColor} text-[11px] font-medium mt-0.5`}>{subtitle}</p>}
        </div>
        <button className={`${moreColor} mt-1`}><MoreVertical size={18} /></button>
      </div>
      <div className={`h-px ${dividerColor} w-full`}></div>
      <div className="px-7 py-8 flex justify-between items-end">
        <div>
          <p className={`${subTextColor} text-[9px] font-black uppercase tracking-[0.2em] mb-2`}>{label}</p>
          <p className={`${textColor} text-5xl font-bold tracking-tighter tabular-nums leading-none`}>{value}</p>
        </div>
        <div className={`${iconBgClass} p-4 rounded-2xl flex items-center justify-center shadow-inner`}>
          <Icon size={28} className={iconColor} />
        </div>
      </div>
    </div>
  );
};

const PaymentStats = ({ payin, payout, processing, pending }: { payin: number; payout: number; processing: number; pending: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Download size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">₹{payin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Upload size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Settlements</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">₹{payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><RefreshCw size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successful</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">{processing}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><PauseCircle size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">{pending}</p>
      </div>
    </div>
  </div>
);

const PieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;
  function getCoordinatesForPercent(percent: number) {
    return [Math.cos(2 * Math.PI * percent), Math.sin(2 * Math.PI * percent)];
  }
  if (total === 0) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">No transaction data yet</div>
  );
  return (
    <div className="flex items-center justify-center gap-10 py-4">
      <div className="relative w-48 h-48">
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
          {data.map((item, index) => {
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += item.value / total;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
            return <path key={index} d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`} fill={item.color} className="hover:opacity-80 transition-opacity cursor-pointer" />;
          })}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 tabular-nums">{((item.value / total) * 100).toFixed(0)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartWithToggle = ({ timePeriod, setTimePeriod, data }: { timePeriod: TimePeriod; setTimePeriod: (t: TimePeriod) => void; data: any[] }) => (
  <Card title="Volume Distribution" subtitle={`Analysis by ${timePeriod.toLowerCase()}`}>
    <div className="flex justify-end mb-4">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {(['DAYS', 'MONTHS', 'YEARS'] as TimePeriod[]).map(t => (
          <button key={t} onClick={() => setTimePeriod(t)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${timePeriod === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t[0]}</button>
        ))}
      </div>
    </div>
    <PieChart data={data} />
  </Card>
);

// --- Main AdminDashboard Page ---
interface AdminDashboardPageProps {
  activeTab: string;
  onInvite?: () => void;
}

const AdminDashboardPage = ({ activeTab, onInvite }: AdminDashboardPageProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('DAYS');
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, txnRes] = await Promise.all([
          getPlatformStats(),
          getAdminTransactions(txnPage, 50),
        ]);
        if (cancelled) return;
        setPlatformStats(statsRes);
        setTransactions(txnRes.data);
        setTxnTotal(txnRes.total);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [txnPage]);

  const stats = useMemo(() => {
    if (!platformStats) return { payinTotal: 0, payoutTotal: 0, processing: 0, pending: 0 };
    return {
      payinTotal: platformStats.transactions.totalVolume,
      payoutTotal: platformStats.pendingSettlements.amount,
      processing: platformStats.transactions.successCount,
      pending: platformStats.transactions.pendingCount,
    };
  }, [platformStats]);

  const pieData = [
    { label: 'Total Volume', value: platformStats?.transactions.totalVolume || 0, color: '#10b981' },
    { label: 'Commission', value: platformStats?.transactions.totalCommission || 0, color: '#3b82f6' },
    { label: 'Pending Settlements', value: platformStats?.pendingSettlements.amount || 0, color: '#f59e0b' },
    { label: 'Failed Txns', value: platformStats?.transactions.failedCount || 0, color: '#ef4444' },
  ];

  const formatCurrency = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const pageTitle = activeTab === 'merchants' ? 'Managed Ecosystem' : activeTab === 'payin' ? 'Payin Overview' : activeTab === 'payout' ? 'Payout Overview' : 'Nexus Core';
  const pageSubtitle = activeTab === 'merchants' ? 'Partner Management & Compliance' : activeTab === 'payin' ? 'Incoming Payments' : activeTab === 'payout' ? 'Outgoing Payments' : 'Platform Operations';

  if (activeTab === 'wallet') return <AdminWalletPage />;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-slate-500 text-lg mt-1 font-medium">{pageSubtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-slate-400" size={32} />
          <span className="ml-3 text-slate-500 font-medium">Loading platform data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
          <p className="text-red-700 font-bold">{error}</p>
          <button onClick={() => setTxnPage(p => p)} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button>
        </div>
      ) : (
        <>
          {(activeTab === 'payin' || activeTab === 'payout' || activeTab === 'merchants') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <OverviewCard
                  title="Partner Network"
                  subtitle="Registered partners"
                  label="TOTAL PARTNERS"
                  value={`${platformStats?.partners.total || 0} (${platformStats?.partners.active || 0} active)`}
                  icon={Store}
                  colorClass="bg-white"
                  iconBgClass="bg-slate-50"
                  isLight={true}
                />
                <OverviewCard
                  subtitle="Platform commission wallet"
                  label="PLATFORM WALLET"
                  value={formatCurrency(platformStats?.platformWallet?.balance || 0)}
                  icon={DollarSign}
                  colorClass="bg-[#0F172A]"
                  iconBgClass="bg-[#1E293B]"
                />
              </div>
              <PaymentStats payin={stats.payinTotal} payout={stats.payoutTotal} processing={stats.processing} pending={stats.pending} />
            </>
          )}

          {(activeTab === 'health' || activeTab === 'audit') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <ChartWithToggle timePeriod={timePeriod} setTimePeriod={setTimePeriod} data={pieData} />
              </div>
              <Card title="Platform Summary">
                <div className="space-y-6">
                  <div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Volume</p><span className="text-lg font-bold">{formatCurrency(platformStats?.transactions.totalVolume || 0)}</span></div>
                  <div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commission Earned</p><span className="text-lg font-bold text-emerald-600">{formatCurrency(platformStats?.transactions.totalCommission || 0)}</span></div>
                  <div className="p-4 bg-slate-100 rounded-2xl text-slate-900 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Transaction Counts</p>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[11px] font-bold"><span>Success</span><span className="text-emerald-600">{platformStats?.transactions.successCount || 0}</span></div>
                      <div className="flex justify-between text-[11px] font-bold"><span>Pending</span><span className="text-amber-600">{platformStats?.transactions.pendingCount || 0}</span></div>
                      <div className="flex justify-between text-[11px] font-bold"><span>Failed</span><span className="text-red-600">{platformStats?.transactions.failedCount || 0}</span></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {(activeTab === 'payin' || activeTab === 'payout') && (
            <Card title="All Transactions" subtitle={`${txnTotal} transactions total`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-50 font-bold">
                      <th className="pb-6 px-4">Transaction ID</th>
                      <th className="pb-6 px-4">Partner</th>
                      <th className="pb-6 px-4">Status</th>
                      <th className="pb-6 px-4 text-right">Amount</th>
                      <th className="pb-6 px-4 text-right">Commission</th>
                      <th className="pb-6 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium">No transactions yet</td></tr>
                    ) : transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="py-6 px-4"><div className="font-bold text-slate-900 text-sm">{t.id.slice(0, 8)}...</div></td>
                        <td className="py-6 px-4 font-bold text-slate-600 text-xs">{t.partner?.businessName || t.partnerId?.slice(0, 8) || '—'}</td>
                        <td className="py-6 px-4"><StatusBadge status={t.status as TransactionStatus} /></td>
                        <td className="py-6 px-4 text-right font-bold text-slate-900 tabular-nums">₹{t.amount.toFixed(2)}</td>
                        <td className="py-6 px-4 text-right font-medium text-amber-600 tabular-nums text-sm">₹{t.commission.toFixed(2)}</td>
                        <td className="py-6 px-4 text-xs text-slate-400 font-medium">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {txnTotal > 50 && (
                  <div className="flex justify-between items-center px-4 py-4 border-t border-slate-100">
                    <button disabled={txnPage <= 1} onClick={() => setTxnPage(p => p - 1)} className="px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30">← Previous</button>
                    <span className="text-xs text-slate-400 font-medium">Page {txnPage} of {Math.ceil(txnTotal / 50)}</span>
                    <button disabled={txnPage >= Math.ceil(txnTotal / 50)} onClick={() => setTxnPage(p => p + 1)} className="px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30">Next →</button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'merchants' && (
            <MerchantPage onInvite={onInvite} />
          )}

          {(activeTab === 'health' || activeTab === 'audit') && platformStats?.partnerWallets && platformStats.partnerWallets.length > 0 && (
            <Card title="Partner Wallets" subtitle={`${platformStats.partnerWallets.length} partner wallets`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-50 font-bold">
                      <th className="pb-6 px-4">Partner</th>
                      <th className="pb-6 px-4">Status</th>
                      <th className="pb-6 px-4 text-right">Balance</th>
                      <th className="pb-6 px-4 text-right">Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {platformStats.partnerWallets.map((w) => (
                      <tr key={w.walletId} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-4 font-bold text-slate-900 text-sm">{w.businessName}</td>
                        <td className="py-5 px-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${w.partnerStatus === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>{w.partnerStatus}</span></td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(w.balance)}</td>
                        <td className="py-5 px-4 text-right text-sm text-slate-600 font-medium">{(w.commissionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
