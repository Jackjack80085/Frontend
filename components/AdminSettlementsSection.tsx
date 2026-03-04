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
  Eye,
} from 'lucide-react';
import { getAdminSettlements, type AdminSettlement } from '../api/settlements';
import AdminSettlementDetailModal from './AdminSettlementDetailModal';

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

const AdminSettlementsSection = () => {
  const [settlements, setSettlements] = useState<AdminSettlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<AdminSettlement | null>(null);
  const per = 20;

  useEffect(() => {
    fetchSettlements();
  }, [page, statusFilter]);

  const fetchSettlements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminSettlements(page, per, statusFilter ? { status: statusFilter } : undefined);
      setSettlements(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / per);

  // Count by status
  const pendingCount = settlements.filter(s => s.status === 'PENDING').length;
  const processingCount = settlements.filter(s => s.status === 'PROCESSING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowDownCircle className="text-emerald-600" size={24} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settlement Queue</h2>
            <p className="text-xs text-slate-500">Review and process partner settlement requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold">
              {pendingCount} Pending
            </span>
          )}
          {processingCount > 0 && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-xl text-xs font-bold">
              {processingCount} Processing
            </span>
          )}
          <button onClick={fetchSettlements} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <RefreshCw size={18} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="animate-spin text-slate-400" size={28} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={fetchSettlements} className="text-xs text-red-600 underline mt-1">Retry</button>
          </div>
        </div>
      ) : settlements.length === 0 ? (
        <div className="py-16 text-center">
          <ArrowDownCircle className="mx-auto text-slate-300" size={48} />
          <p className="mt-3 text-slate-500 font-medium">No settlements found</p>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter ? `No ${statusFilter.toLowerCase()} settlements` : 'Partner settlement requests will appear here'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Partner</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Fee</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Requested</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                      s.status === 'PENDING' ? 'bg-amber-50/30' : s.status === 'PROCESSING' ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{s.partner.businessName}</p>
                      <p className="text-xs text-slate-400">{s.partner.email}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(s.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{fmt(s.fee)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{fmt(s.totalDeducted)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} settlement{total !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
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

      {/* Detail Modal */}
      {selected && (
        <AdminSettlementDetailModal
          settlement={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            fetchSettlements();
          }}
        />
      )}
    </div>
  );
};

export default AdminSettlementsSection;
