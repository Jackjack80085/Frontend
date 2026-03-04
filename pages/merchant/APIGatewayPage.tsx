import React, { useEffect, useState } from 'react';
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  getApiCredentials,
  rotateApiKey,
  getApiKeyHistory,
  updateWebhookUrl,
  type ApiCredentials,
  type ApiKeyHistory,
} from '../../api/partner';

const APIGatewayPage = () => {
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [newSecretGenerated, setNewSecretGenerated] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationReason, setRotationReason] = useState('');
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [history, setHistory] = useState<ApiKeyHistory[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getApiCredentials();
      if (response.success && response.data) {
        setCredentials(response.data);
        setWebhookUrl(response.data.webhookUrl || '');
        setNewSecretGenerated(false);
        setIsSecretVisible(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?._clientMessage ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load API credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKey = async () => {
    if (!rotationReason.trim()) {
      setError('Please provide a reason for rotation');
      return;
    }

    setIsRotating(true);
    setError('');
    try {
      const response = await rotateApiKey(rotationReason);
      if (response.success && response.data) {
        setCredentials(response.data);
        setNewSecretGenerated(true);
        setIsSecretVisible(true);
        setMessage('API key rotated successfully!');
        setShowRotationModal(false);
        setRotationReason('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?._clientMessage ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to rotate API key'
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      setError('Please enter a webhook URL');
      return;
    }

    try {
      new URL(webhookUrl);
    } catch {
      setError('Please enter a valid webhook URL');
      return;
    }

    setSavingWebhook(true);
    setError('');
    try {
      await updateWebhookUrl(webhookUrl);
      setMessage('Webhook URL updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?._clientMessage ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update webhook URL'
      );
    } finally {
      setSavingWebhook(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-red-900 mb-1">No API Credentials</h3>
            <p className="text-sm text-red-700">
              API credentials have not been issued yet. Please contact your account manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const integrationCode = `const API_KEY = "${credentials.apiKey}";
const API_SECRET = "YOUR_API_SECRET";
const BASE_URL = "http://localhost:5000";

function generateSignature(timestampSec, method, path, bodyString) {
  const message = timestampSec + method + path + bodyString;
  return crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');
}

async function initiatePayment(amount, userReference, userEmail) {
  const timestampSec = Math.floor(Date.now() / 1000).toString();
  const body = { amount, currency: 'INR', userReference,
    idempotencyKey: crypto.randomUUID(), userEmail };
  const bodyString = JSON.stringify(body);
  const signature = generateSignature(
    timestampSec, 'POST', '/api/v1/payments/initiate', bodyString
  );
  const response = await axios.post(BASE_URL + '/api/v1/payments/initiate', bodyString, {
    headers: { 'Content-Type': 'application/json',
      'X-API-Key': API_KEY, 'X-Timestamp': timestampSec, 'X-Signature': signature },
  });
  return response.data;
}`;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-emerald-700 font-medium">{message}</p>
          </div>
        </div>
      )}

      {/* Secret Warning Banner */}
      {newSecretGenerated && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Save your API Secret now</p>
            <p className="text-xs text-amber-700 mt-1">
              This is the only time your API secret will be displayed. Save it securely — you won't be able to see it again.
            </p>
          </div>
          <button
            onClick={() => {
              setNewSecretGenerated(false);
              setIsSecretVisible(false);
            }}
            className="text-amber-400 hover:text-amber-600 flex-shrink-0"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* API Credentials + Actions */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">API Credentials</h3>
          <button
            onClick={() => setShowRotationModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Rotate API Keys
          </button>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">API Key</label>
            <div className="mt-1.5 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <code className="flex-1 text-xs text-slate-900 font-mono break-all">
                {credentials.apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(credentials.apiKey, 'apiKey')}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                title="Copy API Key"
              >
                {copiedField === 'apiKey' ? (
                  <CheckCircle2 size={15} className="text-emerald-600" />
                ) : (
                  <Copy size={15} className="text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* API Secret */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">API Secret</label>
            <div className="mt-1.5 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {newSecretGenerated && credentials.apiSecret ? (
                <>
                  <code className="flex-1 text-xs text-slate-900 font-mono break-all">
                    {isSecretVisible ? credentials.apiSecret : '••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setIsSecretVisible(!isSecretVisible)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                    title={isSecretVisible ? 'Hide secret' : 'Show secret'}
                  >
                    {isSecretVisible ? (
                      <EyeOff size={15} className="text-slate-500" />
                    ) : (
                      <Eye size={15} className="text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(credentials.apiSecret!, 'secret')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                    title="Copy API Secret"
                  >
                    {copiedField === 'secret' ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <Copy size={15} className="text-slate-500" />
                    )}
                  </button>
                </>
              ) : (
                <span className="flex-1 text-xs text-slate-400 italic">
                  Secret hidden — rotate keys to generate a new one and view it
                </span>
              )}
            </div>
            {!newSecretGenerated && (
              <p className="text-xs text-slate-400 mt-1">
                For security, the secret is only shown once after rotation.
              </p>
            )}
          </div>

          {/* Key Version + Commission Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Version</label>
              <div className="mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900">v{credentials.apiKeyVersion}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active From</label>
              <div className="mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900">
                  {new Date(credentials.apiKeyActiveFrom).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Commission</label>
              <div className="mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900">{credentials.commissionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Webhook Configuration</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/webhook"
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleSaveWebhook}
              disabled={savingWebhook}
              className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:bg-slate-300 whitespace-nowrap"
            >
              {savingWebhook ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Paycher will POST real-time transaction events to this URL
          </p>
        </div>
      </div>

      {/* Integration Code Snippet — compact scrollable card */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Integration Code</h3>
            <p className="text-xs text-slate-400">Node.js example</p>
          </div>
          <button
            onClick={() => copyToClipboard(integrationCode, 'snippet')}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copiedField === 'snippet' ? (
              <><CheckCircle2 size={12} />Copied!</>
            ) : (
              <><Copy size={12} />Copy</>
            )}
          </button>
        </div>
        <div className="bg-slate-950 rounded-xl overflow-hidden">
          <div className="overflow-y-auto max-h-48 p-4">
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre">{integrationCode}</pre>
          </div>
        </div>
      </div>

      {/* Rotation Modal */}
      {showRotationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Rotate API Keys</h3>
            <p className="text-sm text-slate-600 mb-5">
              Your old API key will be revoked and a new one generated. Update your integration immediately after rotating.
            </p>

            <textarea
              value={rotationReason}
              onChange={(e) => setRotationReason(e.target.value)}
              placeholder="Reason for rotation (e.g., security audit, regular maintenance)"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm mb-4 resize-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRotationModal(false);
                  setRotationReason('');
                }}
                disabled={isRotating}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateKey}
                disabled={isRotating}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                {isRotating ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Rotating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Rotate Keys
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIGatewayPage;
