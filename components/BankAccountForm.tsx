import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  CreditCard,
  Save,
} from 'lucide-react';
import { getBankAccount, updateBankAccount, type BankAccount } from '../api/settlements';

const BankAccountForm = () => {
  const [bankAccount, setBankAccount] = useState<Partial<BankAccount>>({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountType: 'SAVINGS',
    upiId: '',
  });
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    setLoading(true);
    try {
      const res = await getBankAccount();
      if (res.success && res.data.bankAccount) {
        setBankAccount(res.data.bankAccount);
        setVerified(res.data.bankAccountVerified);
      }
    } catch (err: any) {
      console.error('Failed to fetch bank account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!bankAccount.accountNumber || !bankAccount.ifscCode || !bankAccount.accountHolderName || !bankAccount.bankName) {
      setError('Please fill in all required fields (Account Number, IFSC, Holder Name, Bank Name)');
      return;
    }
    setSaving(true);
    try {
      const res = await updateBankAccount(bankAccount as BankAccount);
      if (res.success) {
        setBankAccount(res.data.bankAccount);
        setVerified(res.data.bankAccountVerified);
        setSuccess('Bank account details saved successfully');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-slate-400" size={24} />
        <span className="ml-3 text-slate-500 text-sm">Loading bank details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Bank Account Details</h3>
            <p className="text-xs text-slate-500">Required for settlement withdrawals</p>
          </div>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} />
            Verified
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
          <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Account Holder Name *</label>
          <input
            value={bankAccount.accountHolderName || ''}
            onChange={(e) => setBankAccount(prev => ({ ...prev, accountHolderName: e.target.value }))}
            placeholder="Full name as per bank records"
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Account Number *</label>
          <input
            value={bankAccount.accountNumber || ''}
            onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
            placeholder="Enter account number"
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">IFSC Code *</label>
          <input
            value={bankAccount.ifscCode || ''}
            onChange={(e) => setBankAccount(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
            placeholder="e.g., HDFC0001234"
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Bank Name *</label>
          <input
            value={bankAccount.bankName || ''}
            onChange={(e) => setBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
            placeholder="e.g., HDFC Bank"
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Branch Name</label>
          <input
            value={bankAccount.branchName || ''}
            onChange={(e) => setBankAccount(prev => ({ ...prev, branchName: e.target.value }))}
            placeholder="e.g., Koramangala Branch"
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Account Type</label>
          <select
            value={bankAccount.accountType || 'SAVINGS'}
            onChange={(e) => setBankAccount(prev => ({ ...prev, accountType: e.target.value as 'SAVINGS' | 'CURRENT' }))}
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors bg-white"
          >
            <option value="SAVINGS">Savings Account</option>
            <option value="CURRENT">Current Account</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1.5">UPI ID (Optional)</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={bankAccount.upiId || ''}
              onChange={(e) => setBankAccount(prev => ({ ...prev, upiId: e.target.value }))}
              placeholder="e.g., business@upi"
              className="w-full p-3 pl-10 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="animate-spin" size={16} />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Bank Details
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-amber-700 space-y-1">
            <p className="font-bold">Important:</p>
            <p>Ensure your bank account details are correct. Settlement funds will be transferred to this account.</p>
            <p>Fields marked with * are mandatory for processing settlements.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountForm;
