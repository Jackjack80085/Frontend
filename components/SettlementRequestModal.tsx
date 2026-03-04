import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Wallet,
  Building2,
} from 'lucide-react';
import { requestSettlement, getBankAccount, type BankAccount } from '../api/settlements';
import { getPartnerEarnings, type EarningsSummary } from '../api/wallet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SETTLEMENT_FEE = 10; // matches backend SETTLEMENT_FEE

const SettlementRequestModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankVerified, setBankVerified] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setReason('');
    setError('');
    setSuccess(false);
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [earningsRes, bankRes] = await Promise.all([
        getPartnerEarnings(),
        getBankAccount(),
      ]);
      console.log('[SettlementModal] Earnings:', earningsRes);
      console.log('[SettlementModal] Bank Account:', bankRes);
      setEarnings(earningsRes.summary);
      if (bankRes.success && bankRes.data?.bankAccount) {
        setBankAccount(bankRes.data.bankAccount);
        setBankVerified(bankRes.data.bankAccountVerified);
      }
    } catch (err: any) {
      console.error('[SettlementModal] Load error:', err);
      const errorMsg = typeof err?.message === 'string' ? err.message : 'Failed to load data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const availableBalance = earnings?.availableBalance || 0;
  const parsedAmount = parseFloat(amount) || 0;
  const totalDeducted = parsedAmount + SETTLEMENT_FEE;

  const handleSubmit = async () => {
    setError('');
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (parsedAmount < 100) {
      setError('Minimum settlement amount is ₹100');
      return;
    }
    if (totalDeducted > availableBalance) {
      setError(`Insufficient balance. Available: ${fmt(availableBalance)}, Required: ${fmt(totalDeducted)} (includes ₹${SETTLEMENT_FEE} fee)`);
      return;
    }
    if (!bankAccount || !bankVerified) {
      setError('Please add and verify your bank account details in Settings before requesting a settlement');
      return;
    }

    setSubmitting(true);
    try {
      await requestSettlement(parsedAmount, reason || undefined);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      let errorMsg = 'Failed to request settlement';
      if (typeof err?.response?.data?.error === 'string') {
        errorMsg = err.response.data.error;
      } else if (typeof err?.message === 'string') {
        errorMsg = err.message;
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Withdraw Funds</h2>
              <p className="text-xs text-slate-500">Request settlement to your bank account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
              <span className="ml-3 text-slate-500 text-sm">Loading...</span>
            </div>
          ) : success ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
              <h3 className="text-lg font-bold text-slate-900">Settlement Requested!</h3>
              <p className="text-sm text-slate-500">
                Your withdrawal of {fmt(parsedAmount)} has been submitted for processing.
              </p>
              <p className="text-xs text-slate-400">Fee: {fmt(SETTLEMENT_FEE)} | Total deducted: {fmt(totalDeducted)}</p>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-bold mt-1">{fmt(availableBalance)}</p>
                {earnings && (
                  <div className="flex gap-4 mt-3 text-xs text-slate-400">
                    <span>Current: {fmt(earnings.currentBalance)}</span>
                    <span>Pending: {fmt(earnings.pendingSettlements)}</span>
                  </div>
                )}
              </div>

              {/* Bank Account Info */}
              {bankAccount ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <Building2 className="text-blue-600 flex-shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-blue-900">{bankAccount.bankName}</p>
                    <p className="text-xs text-blue-700">
                      {bankAccount.accountHolderName} •  ****{(bankAccount.accountNumber || '').slice(-4)}
                    </p>
                  </div>
                  {bankVerified && (
                    <CheckCircle2 className="text-blue-600 flex-shrink-0" size={16} />
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-amber-700">
                    No bank account added. Please add your bank details in Settings before requesting a withdrawal.
                  </p>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (min ₹100)"
                  min="100"
                  step="1"
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-lg font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                />
                {parsedAmount > 0 && (
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{fmt(parsedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-medium">{fmt(SETTLEMENT_FEE)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                      <span>Total Deducted:</span>
                      <span>{fmt(totalDeducted)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Reason (Optional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Monthly payout"
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !success && (
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !bankAccount || !bankVerified || parsedAmount <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  Withdraw {parsedAmount > 0 ? fmt(parsedAmount) : ''}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementRequestModal;
