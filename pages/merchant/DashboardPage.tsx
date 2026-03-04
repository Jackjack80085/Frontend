import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Plus,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  PauseCircle,
  AlertCircle,
  MoreVertical,
  XCircle,
  Check,
} from 'lucide-react';
import { getPartnerEarnings, getPartnerTransactions, type EarningsSummary, type PartnerTransaction } from '../../api/wallet';
import MerchantSettingsPage from './SettingsPage';
import MerchantWalletPage from './WalletPage';

// --- Types ---
type TransactionStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
type TimePeriod = 'DAYS' | 'MONTHS' | 'YEARS';

interface Merchant {
  id: string;
  name: string;
  category: string;
  volume: string;
}

const INITIAL_MERCHANTS: Merchant[] = [
  { id: 'M-ACME', name: 'Acme Corp', category: 'Hardware', volume: '₹1.2M' },
  { id: 'M-TECH', name: 'TechCloud', category: 'SaaS', volume: '₹840K' },
  { id: 'M-STAR', name: 'Starbucks', category: 'Dining', volume: '₹2.1M' },
  { id: 'M-APPLE', name: 'Apple Online', category: 'Electronics', volume: '₹45M' },
];

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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payin</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">₹{payin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Upload size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payout</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">₹{payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><RefreshCw size={24} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing</p>
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
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">No data yet</div>
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

// --- PaymentFlowModal (kept in this page since it's triggered from here) ---
const PaymentFlowModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'SUCCESS'>('INPUT');
  const [amount, setAmount] = useState('');
  const [merchantId, setMerchantId] = useState('M-APPLE');
  if (!isOpen) return null;
  const handlePay = () => { setStep('PROCESSING'); setTimeout(() => setStep('SUCCESS'), 1800); };
  const activeMerchant = INITIAL_MERCHANTS.find(m => m.id === merchantId);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0D14]/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10 animate-in zoom-in-95">
        {step === 'INPUT' && (
          <>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900">Initiate Transfer</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><XCircle size={24} /></button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Recipient</label>
                <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900 text-sm appearance-none">
                  {INITIAL_MERCHANTS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">₹</span>
                  <input autoFocus type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-6 py-8 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-emerald-500 text-4xl font-bold tabular-nums text-slate-900" />
                </div>
              </div>
              <button onClick={handlePay} disabled={!amount || parseFloat(amount) <= 0} className="w-full bg-[#0A0D14] text-white py-6 rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">Send Secure Payment</button>
            </div>
          </>
        )}
        {step === 'PROCESSING' && (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-10"></div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Authenticating...</h3>
            <p className="text-slate-500 font-medium">Communicating with Banking Layer v3</p>
          </div>
        )}
        {step === 'SUCCESS' && (
          <div className="py-10 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8"><Check size={48} /></div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Funds Delivered</h3>
            <p className="text-slate-400 text-sm font-mono mb-10 uppercase tracking-widest">ID: #TX-910232</p>
            <div className="w-full p-6 bg-slate-50 rounded-2xl mb-10 text-left space-y-3 border border-slate-100">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400"><span>Recipient</span><span className="text-slate-900">{activeMerchant?.name}</span></div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400"><span>Value</span><span className="text-slate-900 tabular-nums">₹{amount}</span></div>
            </div>
            <button onClick={onClose} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all text-lg">Close Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- APIGenerationView (imported inline here for API Gateway tab) ---
import { getApiCredentials, rotateApiKey, updateWebhookUrl, type ApiCredentials } from '../../api/partner';
import { Eye, EyeOff, Copy, Code2 } from 'lucide-react';

const APIGenerationView = () => {
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationReason, setRotationReason] = useState('');
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [newSecretGenerated, setNewSecretGenerated] = useState(false);

  useEffect(() => { fetchCredentials(); }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await getApiCredentials();
      if (response.success && response.data) {
        setCredentials(response.data);
        setWebhookUrl(response.data.webhookUrl || '');
        if (response.data.apiSecret) { setNewSecretGenerated(true); setIsSecretVisible(true); }
      }
    } catch (err) { console.error('Failed to fetch credentials:', err); }
    finally { setLoading(false); }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotate = async () => {
    if (!rotationReason.trim()) { alert('Please provide a reason for key rotation'); return; }
    setIsRotating(true);
    try {
      const response = await rotateApiKey(rotationReason);
      if (response.success && response.data) {
        setCredentials(response.data);
        setNewSecretGenerated(true);
        setIsSecretVisible(true);
        setShowRotateModal(false);
        setRotationReason('');
        alert('API credentials rotated successfully! Please save your new secret key.');
      }
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to rotate credentials'); }
    finally { setIsRotating(false); }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) { alert('Please enter a webhook URL'); return; }
    try { new URL(webhookUrl); } catch { alert('Please enter a valid URL'); return; }
    setSavingWebhook(true);
    try {
      await updateWebhookUrl(webhookUrl);
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to update webhook URL'); }
    finally { setSavingWebhook(false); }
  };

  const codeSnippet = credentials ? `const axios = require('axios');
const crypto = require('crypto');

const API_KEY = '${credentials.apiKey}';
const API_SECRET = 'YOUR_API_SECRET'; // shown once at key creation/rotation
const BASE_URL = 'http://localhost:5000';

// Canonical string: timestampSec + METHOD + path + rawBodyString
function generateSignature(timestampSec, method, path, bodyString) {
  const message = timestampSec + method + path + bodyString;
  return crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');
}

async function initiatePayment(amount, userReference, userEmail) {
  const timestampSec = Math.floor(Date.now() / 1000).toString();
  const body = {
    amount,
    currency: 'INR',
    userReference,
    idempotencyKey: crypto.randomUUID(), // must be a UUID v4
    userEmail,
  };
  const bodyString = JSON.stringify(body);
  const signature = generateSignature(timestampSec, 'POST', '/api/v1/payments/initiate', bodyString);
  const response = await axios.post(BASE_URL + '/api/v1/payments/initiate', bodyString, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Timestamp': timestampSec,
      'X-Signature': signature,
    },
  });
  return response.data;
}` : '';

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-slate-400" size={32} /></div>;
  if (!credentials) return <div className="text-center py-20"><AlertCircle className="mx-auto text-slate-300 mb-4" size={48} /><p className="text-slate-500">Failed to load API credentials</p></div>;

  return (
    <div className="space-y-6">
      {newSecretGenerated && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-800 font-medium">Save your API Secret now — it won't be shown again after you leave this page.</p>
        </div>
      )}

      {/* Credentials card with Rotate button in header */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">API Credentials</h3>
            <p className="text-[10px] text-slate-400 font-medium">v{credentials.apiKeyVersion} · Active from {new Date(credentials.apiKeyActiveFrom).toLocaleDateString()}</p>
          </div>
          <button onClick={() => setShowRotateModal(true)} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5">
            <RefreshCw size={12} /> Rotate API Keys
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* API Key row */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">API Key</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <code className="flex-1 text-xs font-mono text-slate-700 break-all">{credentials.apiKey}</code>
              <button onClick={() => handleCopy(credentials.apiKey, 'apiKey')} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0" title="Copy API Key">
                {copiedField === 'apiKey' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-400" />}
              </button>
            </div>
          </div>
          {/* API Secret row */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">API Secret</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <code className="flex-1 text-xs font-mono text-slate-700 break-all">
                {credentials.apiSecret
                  ? (isSecretVisible ? credentials.apiSecret : '••••••••••••••••••••••••••••••••••••••••')
                  : <span className="text-slate-400 italic">Rotate keys to generate &amp; view secret</span>
                }
              </code>
              {credentials.apiSecret && (
                <>
                  <button onClick={() => setIsSecretVisible(!isSecretVisible)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0" title={isSecretVisible ? 'Hide' : 'Show'}>
                    {isSecretVisible ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                  </button>
                  <button onClick={() => handleCopy(credentials.apiSecret!, 'apiSecret')} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0" title="Copy secret">
                    {copiedField === 'apiSecret' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-400" />}
                  </button>
                </>
              )}
            </div>
            {!credentials.apiSecret && (
              <p className="text-[10px] text-slate-400 mt-1">Secret is only shown once, immediately after rotation.</p>
            )}
          </div>
          {/* Commission rate */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Commission Rate</label>
            <div className="inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <span className="text-sm font-bold text-slate-900">{credentials.commissionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook */}
      <Card title="Webhook Configuration">
        <div className="flex gap-3">
          <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://yourapp.com/webhook" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500" />
          <button onClick={handleSaveWebhook} disabled={savingWebhook} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {savingWebhook ? 'Saving...' : webhookSuccess ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </Card>

      {/* Integration Code — compact scrollable */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Integration Code</h3>
            <p className="text-[10px] text-slate-400 font-medium">Node.js example</p>
          </div>
          <button onClick={() => handleCopy(codeSnippet, 'code')} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5">
            {copiedField === 'code' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <div className="bg-slate-950 overflow-y-auto max-h-52">
          <pre className="text-xs text-emerald-400 font-mono p-5 leading-relaxed">{codeSnippet}</pre>
        </div>
      </div>
      {showRotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Rotate API Keys</h3>
            <p className="text-sm text-slate-500 mb-6">Your existing API key will be invalidated. Provide a reason for audit logs.</p>
            <textarea value={rotationReason} onChange={(e) => setRotationReason(e.target.value)} placeholder="Reason for rotation..." rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-emerald-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowRotateModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleRotate} disabled={isRotating} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {isRotating ? 'Rotating...' : 'Confirm Rotate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main MerchantDashboard Page ---
interface MerchantDashboardPageProps {
  activeTab: string;
}

const MerchantDashboardPage = ({ activeTab }: MerchantDashboardPageProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('DAYS');
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
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
        const [earningsRes, txnRes] = await Promise.all([
          getPartnerEarnings(),
          getPartnerTransactions(txnPage, 20),
        ]);
        if (cancelled) return;
        setEarnings(earningsRes.summary);
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
    if (!earnings) return { payinTotal: 0, payoutTotal: 0, processing: 0, pending: 0 };
    return {
      payinTotal: earnings.totalPayin,
      payoutTotal: earnings.totalWithdrawn,
      processing: earnings.successTransactions,
      pending: earnings.pendingTransactions,
    };
  }, [earnings]);

  const pieData = [
    { label: 'Payin', value: earnings?.totalPayin || 0, color: '#10b981' },
    { label: 'Commission', value: earnings?.totalCommission || 0, color: '#3b82f6' },
    { label: 'Net Earnings', value: earnings?.totalEarned || 0, color: '#8b5cf6' },
    { label: 'Withdrawn', value: earnings?.totalWithdrawn || 0, color: '#ef4444' },
  ];

  const formatCurrency = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            {activeTab === 'settings' ? 'Settings' : activeTab === 'api_gen' ? 'Developer API Gateway' : 'Merchant Hub'}
          </h1>
          <p className="text-slate-500 text-lg mt-1 font-medium">
            {activeTab === 'settings' ? 'Account verification & preferences' : activeTab === 'api_gen' ? 'Securely manage your integration endpoints' : 'Business Dashboard'}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.open(`${(import.meta as any).env.VITE_API_URL || window.location.origin}/pay`, '_blank', 'noopener,noreferrer')}

            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all"
          >
            <Plus size={20} /> New Payment
          </button>
          <button className="bg-[#0A0D14] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl">Withdraw Funds</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <MerchantSettingsPage />
      ) : activeTab === 'api_gen' ? (
        <APIGenerationView />
      ) : activeTab === 'wallet' ? (
        <MerchantWalletPage />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-slate-400" size={32} />
          <span className="ml-3 text-slate-500 font-medium">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
          <p className="text-red-700 font-bold">{error}</p>
          <button onClick={() => setTxnPage(p => p)} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button>
        </div>
      ) : (
        <>
          {(activeTab === 'analytics' || activeTab === 'ledger') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                <OverviewCard
                  title="Wallet"
                  subtitle="Available for withdrawal"
                  label="AVAILABLE BALANCE"
                  value={formatCurrency(earnings?.availableBalance || 0)}
                  icon={DollarSign}
                  colorClass="bg-[#0F172A]"
                  iconBgClass="bg-[#1E293B]"
                />
                <OverviewCard
                  title="Earnings"
                  subtitle="Total net earnings after commission"
                  label="CURRENT BALANCE"
                  value={formatCurrency(earnings?.currentBalance || 0)}
                  icon={TrendingUp}
                  colorClass="bg-white"
                  iconBgClass="bg-slate-50"
                  isLight={true}
                />
              </div>
              <PaymentStats payin={stats.payinTotal} payout={stats.payoutTotal} processing={stats.processing} pending={stats.pending} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ChartWithToggle timePeriod={timePeriod} setTimePeriod={setTimePeriod} data={pieData} />
                </div>
                <Card title="Earnings Summary" subtitle="Financial breakdown">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payin</p><span className="text-xl font-bold">{formatCurrency(earnings?.totalPayin || 0)}</span></div>
                    <div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commission</p><span className="text-xl font-bold text-amber-600">{formatCurrency(earnings?.totalCommission || 0)}</span></div>
                    <div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Earnings</p><span className="text-xl font-bold text-emerald-600">{formatCurrency(earnings?.totalEarned || 0)}</span></div>
                    <div className="p-5 bg-slate-900 rounded-[1.5rem] text-white">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Settlements</p>
                      <div className="flex justify-between items-center text-xs font-bold"><span>Pending</span><span className="text-amber-400">{formatCurrency(earnings?.pendingSettlements || 0)}</span></div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {(activeTab === 'ledger' || activeTab === 'payin' || activeTab === 'payout') && (
            <Card title="Transaction Ledger" subtitle={`${txnTotal} transactions total`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-50 font-bold">
                      <th className="pb-6 px-4">Transaction ID</th>
                      <th className="pb-6 px-4">Method</th>
                      <th className="pb-6 px-4">Status</th>
                      <th className="pb-6 px-4 text-right">Amount</th>
                      <th className="pb-6 px-4 text-right">Commission</th>
                      <th className="pb-6 px-4 text-right">Net</th>
                      <th className="pb-6 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-medium">No transactions yet</td></tr>
                    ) : transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="py-6 px-4"><div className="font-bold text-slate-900 text-sm">{t.id.slice(0, 8)}...</div><div className="text-[10px] text-slate-400 font-medium">{t.userReference || '—'}</div></td>
                        <td className="py-6 px-4 font-bold text-slate-600 text-xs">{t.paymentMethod || '—'}</td>
                        <td className="py-6 px-4"><StatusBadge status={t.status as TransactionStatus} /></td>
                        <td className="py-6 px-4 text-right font-bold text-slate-900 tabular-nums">₹{t.amount.toFixed(2)}</td>
                        <td className="py-6 px-4 text-right font-medium text-amber-600 tabular-nums text-sm">₹{t.commission.toFixed(2)}</td>
                        <td className="py-6 px-4 text-right font-bold text-emerald-700 tabular-nums">₹{t.netAmount.toFixed(2)}</td>
                        <td className="py-6 px-4 text-xs text-slate-400 font-medium">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {txnTotal > 20 && (
                  <div className="flex justify-between items-center px-4 py-4 border-t border-slate-100">
                    <button disabled={txnPage <= 1} onClick={() => setTxnPage(p => p - 1)} className="px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30">← Previous</button>
                    <span className="text-xs text-slate-400 font-medium">Page {txnPage} of {Math.ceil(txnTotal / 20)}</span>
                    <button disabled={txnPage >= Math.ceil(txnTotal / 20)} onClick={() => setTxnPage(p => p + 1)} className="px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-30">Next →</button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      <PaymentFlowModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
    </div>
  );
};

export default MerchantDashboardPage;
