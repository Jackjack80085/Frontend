import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { getPartnerSettlementsList, type Settlement } from '../api/settlements';

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; Icon: React.FC<any>; label: string }> = {
    PENDING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', Icon: Clock, label: 'Pending' },
    PROCESSING: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', Icon: RefreshCw, label: 'Processing' },
    COMPLETED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', Icon: CheckCircle2, label: 'Completed' },
    FAILED: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', Icon: XCircle, label: 'Failed' },
  };
  const s = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${s.bg} ${s.text} border`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  );
};

const SettlementHistorySection = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const per = 10;

  useEffect(() => {
    fetchSettlements();
  }, [page, statusFilter]);

  const fetchSettlements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPartnerSettlementsList(page, per, statusFilter ? { status: statusFilter } : undefined);
      if (res.success) {
        setSettlements(res.data);
        setTotal(res.total);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / per);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ArrowDownCircle size={20} className="text-emerald-600" />
          Settlement History
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="animate-spin text-slate-400" size={24} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : settlements.length === 0 ? (
        <div className="py-12 text-center">
          <ArrowDownCircle className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-slate-500 font-medium">No settlements yet</p>
          <p className="text-xs text-slate-400 mt-1">Your settlement requests will appear here</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Fee</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Deducted</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">UTR</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Requested</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Completed</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(s.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{fmt(s.fee)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{fmt(s.totalDeducted)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.bankReferenceId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">{total} settlement{total !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      {settlements.length > 0 && settlements.some(s => s.failureReason) && (
        <div className="space-y-2">
          {settlements.filter(s => s.failureReason).map(s => (
            <div key={s.id} className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
              <span className="font-bold text-red-900">#{s.id.slice(0, 8)} failed: </span>
              <span className="text-red-700">{s.failureReason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettlementHistorySection;
