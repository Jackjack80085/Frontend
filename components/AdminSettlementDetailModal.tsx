import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Clock,
  XCircle,
  ArrowRight,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';
import {
  processSettlement,
  completeSettlement,
  failSettlement,
  type AdminSettlement,
} from '../api/settlements';

interface Props {
  settlement: AdminSettlement;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${s.bg} ${s.text} border`}>
      <s.Icon size={14} />
      {s.label}
    </span>
  );
};

const AdminSettlementDetailModal = ({ settlement, isOpen, onClose, onUpdated }: Props) => {
  const [action, setAction] = useState<'idle' | 'process' | 'complete' | 'fail'>('idle');
  const [utrNumber, setUtrNumber] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const bank = settlement.bankAccountSnapshot;

  const handleProcess = async () => {
    setError('');
    setLoading(true);
    try {
      await processSettlement(settlement.id);
      setSuccessMsg('Settlement marked as PROCESSING');
      setTimeout(() => { onUpdated(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setError('');
    if (!utrNumber.trim()) {
      setError('UTR / Bank Reference ID is required');
      return;
    }
    setLoading(true);
    try {
      await completeSettlement(settlement.id, utrNumber.trim());
      setSuccessMsg('Settlement marked as COMPLETED');
      setTimeout(() => { onUpdated(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    setError('');
    if (!failureReason.trim()) {
      setError('Failure reason is required');
      return;
    }
    setLoading(true);
    try {
      await failSettlement(settlement.id, failureReason.trim());
      setSuccessMsg('Settlement marked as FAILED. Funds refunded to partner wallet.');
      setTimeout(() => { onUpdated(); onClose(); }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to mark as failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Settlement Details</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">#{settlement.id.slice(0, 12)}...</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={settlement.status} />
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
            </div>
          )}

          {/* Partner Info */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="text-slate-400" size={18} />
              <h4 className="text-sm font-bold text-slate-900">Partner</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Business Name</p>
                <p className="font-bold text-slate-900">{settlement.partner.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-700">{settlement.partner.email}</p>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-emerald-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="text-emerald-600" size={18} />
              <h4 className="text-sm font-bold text-emerald-900">Amount</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-emerald-600">Requested</p>
                <p className="text-lg font-bold text-emerald-900">{fmt(settlement.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Fee</p>
                <p className="text-lg font-bold text-emerald-900">{fmt(settlement.fee)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Total Deducted</p>
                <p className="text-lg font-bold text-emerald-900">{fmt(settlement.totalDeducted)}</p>
              </div>
            </div>
          </div>

          {/* Bank Account Snapshot */}
          {bank && (
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="text-blue-600" size={18} />
                <h4 className="text-sm font-bold text-blue-900">Bank Account (Snapshot)</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-blue-600">Account Holder</p>
                  <p className="font-bold text-blue-900">{bank.accountHolderName}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Account Number</p>
                  <p className="font-medium text-blue-900 font-mono">{bank.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">IFSC</p>
                  <p className="font-medium text-blue-900 font-mono">{bank.ifscCode}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Bank</p>
                  <p className="font-medium text-blue-900">{bank.bankName}</p>
                </div>
                {bank.branchName && (
                  <div>
                    <p className="text-xs text-blue-600">Branch</p>
                    <p className="font-medium text-blue-900">{bank.branchName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-blue-600">Type</p>
                  <p className="font-medium text-blue-900">{bank.accountType}</p>
                </div>
                {bank.upiId && (
                  <div>
                    <p className="text-xs text-blue-600">UPI</p>
                    <p className="font-medium text-blue-900">{bank.upiId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="text-slate-400" size={18} />
              <h4 className="text-sm font-bold text-slate-900">Timeline</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Requested:</span>
                <span className="font-medium text-slate-900">{new Date(settlement.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {settlement.processedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Processed:</span>
                  <span className="font-medium text-slate-900">{new Date(settlement.processedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {settlement.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed:</span>
                  <span className="font-medium text-slate-900">{new Date(settlement.completedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {settlement.bankReferenceId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">UTR / Bank Ref:</span>
                  <span className="font-bold font-mono text-slate-900">{settlement.bankReferenceId}</span>
                </div>
              )}
              {settlement.failureReason && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Failure Reason:</span>
                  <span className="font-medium text-red-700">{settlement.failureReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {settlement.status === 'PENDING' && action === 'idle' && !successMsg && (
            <div className="flex gap-3">
              <button
                onClick={handleProcess}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                Accept & Start Processing
              </button>
              <button
                onClick={() => setAction('fail')}
                className="px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {settlement.status === 'PROCESSING' && action === 'idle' && !successMsg && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700 font-medium">
                  Transfer <strong>{fmt(settlement.amount)}</strong> to the bank account above, then enter the UTR number below.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction('complete')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 size={16} />
                  Mark as Completed
                </button>
                <button
                  onClick={() => setAction('fail')}
                  className="px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  Mark as Failed
                </button>
              </div>
            </div>
          )}

          {/* Complete form */}
          {action === 'complete' && !successMsg && (
            <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <h4 className="text-sm font-bold text-emerald-900">Enter Bank Transfer Details</h4>
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">UTR / Bank Reference Number *</label>
                <input
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR number from bank transfer"
                  className="w-full p-3 border-2 border-emerald-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Confirm Completion
                </button>
                <button onClick={() => setAction('idle')} className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Fail form */}
          {action === 'fail' && !successMsg && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <h4 className="text-sm font-bold text-red-900">
                {settlement.status === 'PENDING' ? 'Reject Settlement' : 'Mark as Failed'}
              </h4>
              <p className="text-xs text-red-700">
                This will refund {fmt(settlement.totalDeducted)} back to the partner's wallet.
              </p>
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">Reason *</label>
                <input
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Enter reason for rejection/failure"
                  className="w-full p-3 border-2 border-red-300 rounded-xl text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleFail}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <XCircle size={16} />}
                  Confirm {settlement.status === 'PENDING' ? 'Rejection' : 'Failure'}
                </button>
                <button onClick={() => setAction('idle')} className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettlementDetailModal;
