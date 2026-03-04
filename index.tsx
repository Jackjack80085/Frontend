
import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  XCircle,
  Search,
  Bell,
  Activity,
  RefreshCw,
  Key,
  Lock,
  History,
  Mail,
  ArrowRight,
  Store,
  Check,
  CheckCircle2,
  LogOut,
  User,
  DollarSign,
  AlertCircle,
  Download,
  Upload,
  ShieldAlert,
  Globe,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

// API imports
import { adminLogin, partnerLogin, healthCheck } from './api/auth';
import { verifyInviteToken, completeRegistration } from './api/onboarding';
import { storage } from './utils/storage';
import { invitePartner } from './api/partner';
import MerchantDashboardPage from './pages/merchant/DashboardPage';
import AdminDashboardPage from './pages/admin/DashboardPage';

// --- Types & Constants ---

type Role = 'Merchant' | 'Admin';


// --- Invite Partner Modal ---
interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InvitePartnerModal = ({ isOpen, onClose, onSuccess }: InvitePartnerModalProps) => {
  const [formData, setFormData] = useState({ businessName: '', email: '', phone: '', businessType: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.email) {
      setError('Business name and email are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await invitePartner(formData as any);
      if (response.success && response.data) {
        setInviteLink(response.data.inviteLink);
        setShowSuccess(true);
        setTimeout(() => {
          setFormData({ businessName: '', email: '', phone: '', businessType: '' });
          setShowSuccess(false);
          setInviteLink('');
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      setError(err?.response?.data?._clientMessage || err?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Invite New Partner</h2>
              <p className="text-sm text-slate-500 mt-1">Send invitation to onboard a new partner</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><XCircle size={20} className="text-slate-600" /></button>
          </div>

          {showSuccess && (
            <div className="mb-6 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 mb-2">Invitation Sent Successfully!</h3>
                  <p className="text-sm text-emerald-700 mb-3">Partner will receive invitation email with this link:</p>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className="flex-1 px-4 py-3 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-emerald-900" />
                    <button onClick={handleCopyLink} className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"><Copy size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Business Name *</label>
              <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="e.g., Gaming Pro" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" disabled={loading || showSuccess} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Address *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="partner@gamingpro.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" disabled={loading || showSuccess} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" disabled={loading || showSuccess} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Business Type</label>
              <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" disabled={loading || showSuccess}>
                <option value="">Select type...</option>
                <option value="Gaming">Gaming</option>
                <option value="E-commerce">E-commerce</option>
                <option value="EdTech">EdTech</option>
                <option value="SaaS">SaaS</option>
                <option value="Marketplace">Marketplace</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {!showSuccess && (
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors" disabled={loading}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-6 py-4 bg-[#0A0D14] text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (<><RefreshCw className="animate-spin" size={16} />Sending...</>) : (<><Mail size={16} />Send Invitation</>)}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Partner Registration (Onboarding) Component ---
interface PartnerRegistrationProps {
  token: string;
  onComplete: () => void;
}

const PartnerRegistration = ({ token, onComplete }: PartnerRegistrationProps) => {
  const [verifying, setVerifying] = useState(true);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyToken = async () => {
    setVerifying(true);
    setError('');
    try {
      console.log('Verifying invite token:', token);
      const response = await verifyInviteToken(token);
      if (response.success && response.data) {
        setPartnerData(response.data);
        setPhone(response.data.phone || '');
        console.log('Invite verified:', response.data);
      } else {
        throw new Error(response.message || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Token verification error:', err);
      setError(err.response?.data?._clientMessage || err.response?.data?.message || 'Invalid or expired invitation link');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please enter password and confirm it');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Completing registration...');
      const response = await completeRegistration({ token, password, phone: phone || undefined });
      if (response.success) {
        console.log('Registration complete:', response.data);
        setSuccess(true);
        // show inline success, then navigate back to login
        setTimeout(() => onComplete(), 1200);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const apiErr = err?.response?.data?.error || err?.response?.data;
      if (apiErr?.details && Array.isArray(apiErr.details)) {
        // details from Zod validation → array of { field, message }
        setError(apiErr.details.map((d: any) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('; '));
      } else {
        setError(apiErr?.message || err.response?.data?._clientMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-emerald-600" size={48} />
          <p className="text-lg font-semibold text-slate-700">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !partnerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button onClick={() => (window.location.href = '/')} className="px-6 py-3 bg-[#0A0D14] text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#0A0D14] to-slate-800 p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative">
            <div className="w-14 h-14 bg-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <ShieldCheck className="text-[#0A0D14]" size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">Welcome to<br />NexusPay</h1>
            <p className="text-2xl text-slate-300 font-light">Complete your<br /><span className="text-emerald-400 font-semibold">registration.</span></p>
          </div>

          <div className="relative space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="text-sm font-medium">Secure Payment Processing</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="text-sm font-medium">Instant Settlements</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="text-sm font-medium">24/7 API Access</span>
            </div>
          </div>
        </div>

        <div className="p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Complete Registration</h2>
            <p className="text-slate-500 font-medium">Set up your partner account</p>
          </div>

          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
            {success ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="text-emerald-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 mb-1">Registration Successful</h3>
                  <p className="text-sm text-emerald-700">Your account is ready. Redirecting to login…</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-emerald-900 mb-3">Business Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-900">{partnerData?.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-emerald-600" />
                    <span className="text-sm text-slate-600">{partnerData?.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Create Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" className="w-full px-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" disabled={loading} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Confirm Password *</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full px-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" disabled={loading} required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Phone Number (Optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all" disabled={loading} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#0A0D14] text-white font-bold py-5 rounded-2xl text-sm hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">{loading ? (<><RefreshCw className="animate-spin" size={18} />Setting up account...</>) : (<>Complete Registration<ArrowRight size={18} /></>)}</button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">Already have an account? <span onClick={() => (window.location.href = '/')} className="text-emerald-600 font-bold cursor-pointer hover:underline">Login here</span></p>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLogin }: { onLogin: (role: Role) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Merchant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login...', { email, role });
      let response;
      if (role === 'Admin') {
        response = await adminLogin({ email, password });
      } else {
        response = await partnerLogin({ email, password });
      }

      console.log('Login response:', response);

      if (!response.success || !response.data?.token) {
        throw new Error(response.message || 'Invalid response from server');
      }

      storage.setToken(response.data.token);
      storage.setRole(role);
      // persist partner profile locally for UI seeding
      if (role !== 'Admin' && response.data.partner) {
        try {
          storage.setPartnerProfile(response.data.partner);
        } catch (e) {
          console.warn('Failed to persist partner profile', e);
        }
      }

      onLogin(role);
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      const resp = err?.response?.data || {};
      if (resp._clientMessage) errorMessage = resp._clientMessage;
      else if (resp.message) errorMessage = resp.message;
      else if (resp.error?.message) errorMessage = resp.error.message;
      else if (err?.message) errorMessage = err.message;

      const retry = resp._retryAfter || resp.error?.details?.retryAfter || err?.response?.headers?.['retry-after'];
      if (retry) {
        errorMessage += ` (retry after ${retry}s)`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-poppins selection:bg-emerald-100">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex overflow-hidden border border-slate-200">
        <div className="hidden lg:flex w-[45%] bg-[#0A0D14] p-16 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-emerald-500 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600 blur-[100px]"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <ShieldCheck className="text-white" size={28} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">NexusPay</span>
            </div>
            <h1 className="text-[3.5rem] font-bold leading-[1.05] tracking-tight mb-8">
              Seamless <br/>Financial <br/><span className="text-emerald-500">Infrastructure.</span>
            </h1>
          </div>
          <div className="relative z-10 flex items-center gap-6 text-[11px] font-bold text-slate-500 px-2 uppercase tracking-widest">
            <span className="flex items-center gap-2"><Lock size={14} className="text-emerald-500"/> PCI-DSS LEVEL 1</span>
          </div>
        </div>
        <div className="flex-1 p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 mb-6 font-medium">Access your internal gateway.</p>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gateway Access</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Merchant', 'Admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                      role === r
                        ? 'bg-[#0A0D14] text-white border-[#0A0D14] shadow-lg'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gateway Access</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@paycher.com or merchant@acme.com"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
                disabled={loading}
              />
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Security Passcode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#0A0D14] text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                <>
                  Authorize Protocol
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="mt-10 flex flex-col items-center gap-4">
              <button onClick={() => { /* placeholder for register */ }} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Don't have an account? Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ role, activeTab, onTabChange, onLogout }: { role: Role, activeTab: string, onTabChange: (id: string) => void, onLogout: () => void }) => {
  const tabs = role === 'Merchant'
    ? [
        { id: 'analytics', icon: LayoutDashboard, label: 'Business' },
        { id: 'wallet', icon: DollarSign, label: 'Wallet' },
        { id: 'payin', icon: Download, label: 'Payin' },
        { id: 'payout', icon: Upload, label: 'Payout' },
        { id: 'ledger', icon: RefreshCw, label: 'Ledger' },
        { id: 'api_gen', icon: Key, label: 'API Gateway' },
        { id: 'settings', icon: Settings, label: 'Settings' }
      ]
    : [
        { id: 'health', icon: Activity, label: 'Control' },
        { id: 'wallet', icon: DollarSign, label: 'Wallet' },
        { id: 'payin', icon: Download, label: 'Payin' },
        { id: 'payout', icon: Upload, label: 'Payout' },
        { id: 'merchants', icon: Store, label: 'Merchants' }
      ];

  return (
    <div className="w-[18rem] bg-white border-r border-slate-200 h-screen sticky top-0 px-8 py-10 flex flex-col font-poppins">
      <div className="flex items-center gap-3 mb-16">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30"><ShieldCheck className="text-white" size={24} /></div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">NexusPay</span>
      </div>
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 px-5">Protocol Shell</p>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#0A0D14] text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <tab.icon size={20} />{tab.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-10 border-t border-slate-100 space-y-8">
        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0A0D14] flex items-center justify-center text-white font-bold text-xs">{role[0]}</div>
          <div><p className="text-sm font-bold text-slate-900">{role}</p><p className="text-[10px] text-slate-400 font-bold uppercase">System Active</p></div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"><LogOut size={20} /> Terminate Session</button>
      </div>
    </div>
  );
};

const Header = ({ title, role, onLogout }: { title: string, role: Role, onLogout: () => void }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifs = useMemo(() => {
    if (role === 'Admin') return [
      { id: 1, icon: ShieldAlert, title: 'Node Outage Warning', desc: 'Latency spike in Mumbai cluster AZ-04.', color: 'text-red-500' },
      { id: 2, icon: User, title: 'New Merchant Request', desc: 'Starbucks Inc. submitted for review.', color: 'text-blue-500' },
      { id: 3, icon: Globe, title: 'Compliance Refresh', desc: 'RBI regulatory lists updated.', color: 'text-emerald-500' },
    ];
    return [
      { id: 1, icon: Download, title: 'Payin Success', desc: '₹12,299.00 from U-JOHN settled.', color: 'text-emerald-500' },
      { id: 2, icon: History, title: 'Payout Processed', desc: 'Batch settlement delivered to HDFC.', color: 'text-blue-500' },
      { id: 4, icon: AlertCircle, title: 'Chargeback Filed', desc: 'U-SARA disputed TX-1002.', color: 'text-red-500' },
    ];
  }, [role]);

  return (
    <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-12">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {role === 'Admin' && (
          <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Global Healthy</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-8">
        <div className="relative group hidden md:block">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Command Interface (⌘K)" className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all w-[20rem]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all relative">
              <Bell size={24} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h4 className="text-sm font-bold text-slate-900">Notifications</h4><button className="text-[10px] font-bold text-emerald-600 uppercase">Clear All</button></div>
                <div className="max-h-96 overflow-y-auto">
                   {notifs.map(n => (
                     <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer flex gap-4">
                        <div className={`p-2 rounded-xl bg-slate-50 ${n.color}`}><n.icon size={18} /></div>
                        <div><p className="text-xs font-bold text-slate-900">{n.title}</p><p className="text-[10px] text-slate-500 mt-0.5">{n.desc}</p></div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="h-12 w-12 rounded-2xl bg-[#0A0D14] border-4 border-slate-100 flex items-center justify-center text-white font-bold text-sm shadow-xl">{role[0]}</button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="p-6 bg-slate-50 border-b border-slate-100"><p className="text-xs font-bold text-slate-900">{role} Instance</p><p className="text-[10px] text-slate-500 font-medium">Internal Domain Auth</p></div>
                <div className="p-2">
                   <button className="w-full text-left px-5 py-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-700"><User size={16} /> Identity Core</button>
                   <div className="h-px bg-slate-100 my-2 mx-4"></div>
                   <button onClick={onLogout} className="w-full text-left px-5 py-3 rounded-xl hover:bg-red-50 flex items-center gap-3 text-xs font-bold text-red-500"><LogOut size={16} /> Terminate</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, error: err?.message || String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="bg-white border border-red-200 rounded-3xl p-10 max-w-lg w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="text-red-500" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-6 font-mono bg-slate-50 p-3 rounded-xl text-left break-words">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const getRouteFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/^\/onboarding\/invite\/([A-Za-z0-9-]+)$/);
    if (match) return { type: 'onboarding' as const, token: match[1] };
    return { type: 'main' as const };
  };

  const [currentRoute, setCurrentRoute] = useState(getRouteFromUrl());

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(getRouteFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [role, setRole] = useState<Role | null>(() => storage.getRole());
  const [activeTab, setActiveTab] = useState('');
  
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (role === 'Merchant') setActiveTab('analytics');
    else if (role === 'Admin') setActiveTab('health');
  }, [role]);

  // On mount, ensure role is derived from persisted storage when token exists
  useEffect(() => {
    const token = storage.getToken();
    const persistedRole = storage.getRole();
    if (token && persistedRole && !role) {
      setRole(persistedRole);
    }
    // if token exists but no role, clear token
    if (token && !persistedRole) {
      storage.removeToken();
    }
    // ensure active tab matches path (support /admin and /partner paths)
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      setRole('Admin');
      setActiveTab('health');
    } else if (path.startsWith('/partner')) {
      setRole('Merchant');
      setActiveTab('analytics');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Test backend connection on app load
    healthCheck()
      .then(() => console.log('✅ Backend connected'))
      .catch((err) => console.error('❌ Backend connection failed:', err));
  }, []);

  

  const handleLogout = () => {
    storage.clear();
    setRole(null);
    setActiveTab('');
  };

  // Handle onboarding route (public)
  if ((currentRoute as any).type === 'onboarding' && (currentRoute as any).token) {
    return (
      <PartnerRegistration
        token={(currentRoute as any).token}
        onComplete={() => {
          window.history.pushState({}, '', '/');
          setCurrentRoute({ type: 'main' });
        }}
      />
    );
  }

  if (!role) {
    return <LoginView onLogin={setRole} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-poppins selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      <Sidebar role={role} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header title={role === 'Merchant' ? 'Merchant Ecosystem' : 'Infrastructure Control'} role={role} onLogout={handleLogout} />
        <main className="p-12 flex-1 overflow-y-auto">
          {role === 'Merchant' && <MerchantDashboardPage activeTab={activeTab} />}
          {role === 'Admin' && <AdminDashboardPage activeTab={activeTab} onInvite={() => setShowInviteModal(true)} />}
        </main>
      </div>
      <InvitePartnerModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} onSuccess={() => { window.dispatchEvent(new Event('partners:refetch')); }} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
