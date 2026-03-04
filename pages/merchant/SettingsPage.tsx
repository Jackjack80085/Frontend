import React, { useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  RefreshCw,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  User,
  Bell,
  Key,
  Building2,
} from 'lucide-react';
import {
  uploadKYCDocument,
  getPartnerKYCDocuments,
  deleteKYCDocument,
  type KYCDocument,
  type KYCDocumentType
} from '../../api/kyc';
import { updatePartnerProfile, changePartnerPassword, getPartnerProfile, type Partner } from '../../api/partner';
import { storage } from '../../utils/storage';
import { apiClient } from '../../api/axios';
import BankAccountForm from '../../components/BankAccountForm';

const DOCUMENT_TYPES: { type: KYCDocumentType; label: string; required: boolean }[] = [
  { type: 'BUSINESS_REGISTRATION', label: 'Business Registration Certificate', required: true },
  { type: 'PAN_CARD', label: 'PAN Card', required: true },
  { type: 'GST_CERTIFICATE', label: 'GST Certificate', required: true },
  { type: 'BANK_PROOF', label: 'Bank Account Proof', required: true },
  { type: 'DIRECTOR_ID', label: 'Director ID Proof (Aadhaar/PAN)', required: false },
  { type: 'ADDRESS_PROOF', label: 'Address Proof', required: false }
];

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; border: string; label: string; Icon: React.FC<any> }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending Review', Icon: Clock },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved', Icon: CheckCircle2 },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected', Icon: XCircle }
  };
  const style = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.border} border`}>
      <style.Icon size={12} />
      {style.label}
    </span>
  );
};

/* ─── KYC Tab Content ─── */
const KYCTabContent = () => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getPartnerKYCDocuments();
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch KYC documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (type: KYCDocumentType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, PNG files are allowed');
      return;
    }

    setUploadingType(type);
    setError('');

    try {
      const response = await uploadKYCDocument(type, file);
      if (response.success && response.data) {
        await fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to upload document');
    } finally {
      setUploadingType(null);
      event.target.value = '';
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      await deleteKYCDocument(docId);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete document');
    }
  };

  const getDocumentForType = (type: KYCDocumentType) => {
    return documents.find(doc => doc.documentType === type);
  };

  const requiredDocsCount = DOCUMENT_TYPES.filter(d => d.required).length;
  const approvedDocsCount = documents.filter(d =>
    DOCUMENT_TYPES.find(t => t.type === d.documentType && t.required) && d.status === 'APPROVED'
  ).length;
  const uploadedRequiredCount = DOCUMENT_TYPES.filter(d => d.required && getDocumentForType(d.type)).length;
  const progressPercent = requiredDocsCount > 0 ? Math.round((approvedDocsCount / requiredDocsCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-emerald-900">Verification Progress</h3>
            <p className="text-sm text-emerald-700 mt-1">
              {approvedDocsCount} of {requiredDocsCount} required documents approved
            </p>
            {uploadedRequiredCount < requiredDocsCount && (
              <p className="text-xs text-emerald-600 mt-1">
                Upload all {requiredDocsCount} required documents to submit for review
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600">{progressPercent}%</div>
            <p className="text-xs text-emerald-700 font-medium">Complete</p>
          </div>
        </div>
        <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = getDocumentForType(docType.type);
          const isUploading = uploadingType === docType.type;

          return (
            <div
              key={docType.type}
              className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    {docType.label}
                    {docType.required && (
                      <span className="text-xs text-red-500 font-bold">*</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {docType.required ? 'Required for activation' : 'Optional'}
                  </p>
                </div>
                {existingDoc && <StatusBadge status={existingDoc.status} />}
              </div>

              {existingDoc ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <FileText className="text-slate-400" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {existingDoc.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(existingDoc.fileSize / 1024).toFixed(1)} KB &bull; {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {existingDoc.status === 'REJECTED' && existingDoc.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-bold text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-xs text-red-700">{existingDoc.rejectionReason}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          setError('')
                          const resp = await apiClient.get(`/api/v1/partner/kyc-documents/${existingDoc.id}/file`, { responseType: 'blob' as any })
                          const contentType = (resp.headers && resp.headers['content-type']) || 'application/octet-stream'
                          const blob = new Blob([resp.data], { type: contentType })
                          const url = URL.createObjectURL(blob)
                          window.open(url, '_blank')
                          setTimeout(() => URL.revokeObjectURL(url), 60_000)
                        } catch (err: any) {
                          console.error('Failed to open file', err)
                          setError(err?.response?.data?._clientMessage || err?.message || 'Failed to open document')
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    {existingDoc.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleDelete(existingDoc.id, existingDoc.fileName)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>

                  {existingDoc.status === 'REJECTED' && (
                    <div>
                      <input
                        type="file"
                        id={`reupload-${docType.type}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(docType.type, e)}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor={`reupload-${docType.type}`}
                        className="block w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer text-center"
                      >
                        {isUploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="animate-spin" size={16} />
                            Uploading...
                          </span>
                        ) : 'Re-upload Document'}
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id={`upload-${docType.type}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(docType.type, e)}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor={`upload-${docType.type}`}
                    className={`block w-full px-6 py-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      isUploading
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <RefreshCw className="animate-spin" size={18} />
                        <span className="text-sm font-semibold">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="text-slate-400" size={24} />
                        <span className="text-sm font-bold text-slate-700">Upload Document</span>
                        <span className="text-xs text-slate-500">PDF, JPG, PNG (Max 5MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Important Notes</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>All documents marked with (*) are required for account activation</li>
              <li>Upload clear, readable copies of original documents</li>
              <li>Documents will be reviewed within 24-48 hours after all required docs are uploaded</li>
              <li>You'll receive an email once your KYC is approved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Settings Tabs ─── */
type SettingsTab = 'kyc' | 'profile' | 'bank' | 'notifications' | 'security';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.FC<any>; available: boolean }[] = [
  { id: 'kyc', label: 'KYC Verification', icon: Shield, available: true },
  { id: 'profile', label: 'Profile', icon: User, available: true },
  { id: 'bank', label: 'Bank Account', icon: Building2, available: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, available: false },
  { id: 'security', label: 'Security', icon: Key, available: false },
];

/* ─── Profile Tab Content ─── */
const ProfileTabContent = () => {
  const [profile, setProfile] = useState<Partial<Partner>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [passwordMode, setPasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // seed from local storage so UI shows something immediately
    const seed = storage.getPartnerProfile()
    if (seed) setProfile(seed as Partial<Partner>)

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await getPartnerProfile()
        if (res.success && res.data) {
          setProfile(res.data as Partial<Partner>)
          // update persisted copy
          try { storage.setPartnerProfile(res.data) } catch {}
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, []);

  // profile image removed

  const handleSave = async () => {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const toUpdate: Partial<Partner> = {
        businessName: profile.businessName,
        email: profile.email,
        phone: profile.phone
      };
      const res = await updatePartnerProfile(toUpdate).catch(e => { throw e; });
      if (res.success && res.data) {
        setProfile(res.data);
        setMessage('Profile saved');
      }
    } catch (err: any) {
      setError(err?.response?.data?._clientMessage || err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setMessage('');
    if (!currentPassword || !newPassword) {
      setError('Please fill both current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await changePartnerPassword(currentPassword, newPassword);
      if (res.success) {
        setMessage('Password changed');
        setPasswordMode(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err?.response?.data?._clientMessage || err?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{message}</div>}

      <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Business Name</label>
            <input value={profile.businessName || ''} onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))} className="w-full mt-1 p-3 border rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input value={profile.email || ''} onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))} className="w-full mt-1 p-3 border rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Phone</label>
            <input value={profile.phone || ''} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} className="w-full mt-1 p-3 border rounded-xl" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">{saving ? 'Saving...' : 'Save Profile'}</button>
            <button onClick={() => setPasswordMode(!passwordMode)} className="px-6 py-3 bg-slate-100 rounded-xl">{passwordMode ? 'Cancel' : 'Change Password'}</button>
          </div>

          {passwordMode && (
            <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="text-xs text-slate-500">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-slate-500">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-xl" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleChangePassword} disabled={saving} className="px-5 py-2 bg-red-600 text-white rounded-xl">{saving ? 'Changing...' : 'Change Password'}</button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

const MerchantSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('kyc');

  return (
    <div className="flex gap-8">
      {/* Left sidebar - tab navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-0 space-y-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.available && setActiveTab(tab.id)}
              disabled={!tab.available}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                  : tab.available
                    ? 'text-slate-600 hover:bg-slate-50 border-2 border-transparent'
                    : 'text-slate-300 cursor-not-allowed border-2 border-transparent'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {!tab.available && (
                <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase">Soon</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 min-w-0">
        {activeTab === 'kyc' && <KYCTabContent />}
        {activeTab === 'profile' && (
          <ProfileTabContent />
        )}
        {activeTab === 'bank' && (
          <BankAccountForm />
        )}
        {activeTab === 'notifications' && (
          <div className="py-20 text-center text-slate-400">Notification settings coming soon</div>
        )}
        {activeTab === 'security' && (
          <div className="py-20 text-center text-slate-400">Security settings coming soon</div>
        )}
      </div>
    </div>
  );
};

export default MerchantSettingsPage;
