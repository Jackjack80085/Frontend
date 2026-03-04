import React, { useEffect, useState } from 'react';
import { ArrowRight, X, Eye, CheckCircle2, XCircle, Clock, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/axios';
import { getAllPartners, getPartnerById, type Partner } from '../../api/partner';
import { getPartnerKYCDocumentsAdmin, reviewKYCDocument, type KYCDocument, type KYCAdminMeta } from '../../api/kyc';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_REGISTRATION: 'Business Registration Certificate',
  PAN_CARD: 'PAN Card',
  GST_CERTIFICATE: 'GST Certificate',
  BANK_PROOF: 'Bank Account Proof',
  DIRECTOR_ID: 'Director ID Proof',
  ADDRESS_PROOF: 'Address Proof'
};

const PartnerCard: React.FC<{ m: any; onOpen?: (m: any) => void }> = ({ m, onOpen }) => (
  <div onClick={() => onOpen && onOpen(m)} className="cursor-pointer p-6 border border-slate-100 rounded-3xl hover:border-emerald-500 transition-all bg-slate-50/50">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-emerald-600 shadow-sm">{(m.businessName || m.name || '').charAt(0) || 'P'}</div>
      <div><p className="text-sm font-bold text-slate-900">{m.businessName || m.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{(m.category || m.businessType) || '—'}</p></div>
    </div>
    <div className="flex justify-between items-end"><div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vol</p><p className="text-sm font-bold text-slate-900">{m.volume || '—'}</p></div><ArrowRight size={16} className="text-slate-300" /></div>
  </div>
);

const KYCStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; border: string; label: string; Icon: React.FC<any> }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending', Icon: Clock },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved', Icon: CheckCircle2 },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected', Icon: XCircle }
  };
  const style = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${style.bg} ${style.text} ${style.border} border`}>
      <style.Icon size={12} />
      {style.label}
    </span>
  );
};

const PartnerStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'PENDING' },
    REGISTERED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'REGISTERED' },
    SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'SUBMITTED' },
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'ACTIVE' },
    SUSPENDED: { bg: 'bg-red-50', text: 'text-red-700', label: 'SUSPENDED' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'REJECTED' }
  };
  const style = config[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status };
  return (
    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

/* ─── Partner Detail Panel (slide-in from right) ─── */
interface PartnerDetailPanelProps {
  partner: Partner;
  onClose: () => void;
  onUpdate: () => void;
}

const PartnerDetailPanel = ({ partner, onClose, onUpdate }: PartnerDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc'>('profile');
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [kycMeta, setKycMeta] = useState<KYCAdminMeta | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<KYCDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'kyc') fetchKYCDocuments();
  }, [activeTab, partner.id]);

  const fetchKYCDocuments = async () => {
    setLoadingKyc(true);
    try {
      const res = await getPartnerKYCDocumentsAdmin(partner.id);
      if (res.success && res.data) {
        setKycDocuments(res.data);
        setKycMeta(res.meta || null);
      } else {
        setKycDocuments([]);
        setKycMeta(null);
      }
    } catch {
      setKycDocuments([]);
      setKycMeta(null);
    } finally {
      setLoadingKyc(false);
    }
  };

  const handleApprove = async (doc: KYCDocument) => {
    if (!confirm(`Approve "${DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}"?`)) return;
    setReviewingDocId(doc.id);
    setError('');
    try {
      const res = await reviewKYCDocument(doc.id, 'APPROVED');
      if (res.success) {
        await fetchKYCDocuments();
        onUpdate();
      } else {
        setError(res.message || 'Failed to approve');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve document');
    } finally {
      setReviewingDocId(null);
    }
  };

  const openRejectModal = (doc: KYCDocument) => {
    setDocumentToReject(doc);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!documentToReject) return;
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setReviewingDocId(documentToReject.id);
    setError('');
    try {
      const res = await reviewKYCDocument(documentToReject.id, 'REJECTED', rejectReason.trim());
      if (res.success) {
        setShowRejectModal(false);
        setDocumentToReject(null);
        setRejectReason('');
        await fetchKYCDocuments();
        onUpdate();
      } else {
        setError(res.message || 'Failed to reject');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject document');
    } finally {
      setReviewingDocId(null);
    }
  };

  const approvedCount = kycDocuments.filter(d => d.status === 'APPROVED').length;
  const totalCount = kycDocuments.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{partner.businessName || 'Partner Details'}</h2>
              <p className="text-emerald-100 text-sm">Partner ID: {partner.id}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-emerald-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'kyc'
                  ? 'bg-white text-emerald-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              KYC
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-900">{partner.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{partner.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</p>
                <p className="text-sm font-semibold text-slate-900">{(partner as any).businessType || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <PartnerStatusBadge status={(partner as any).status || '—'} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">KYC Status</p>
                <PartnerStatusBadge status={(partner as any).kycStatus || '—'} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created</p>
                <p className="text-sm text-slate-600">{new Date((partner as any).createdAt || Date.now()).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* ── KYC Tab ── */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              {loadingKyc ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="animate-spin text-slate-400" size={32} />
                </div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium">No KYC documents uploaded yet</p>
                  <p className="text-slate-400 text-xs mt-1">Partner hasn't submitted any documents</p>
                </div>
              ) : kycMeta && !kycMeta.allRequiredUploaded ? (
                /* ── Waiting for partner to upload all required docs ── */
                <div className="space-y-6">
                  <div className="text-center py-10">
                    <Clock className="mx-auto text-amber-400 mb-4" size={48} />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Waiting for Documents</h4>
                    <p className="text-sm text-slate-500 mb-6">
                      Partner has uploaded {kycMeta.uploadedRequiredCount} of {kycMeta.requiredCount} required documents.
                      <br />Documents will appear for review once all required uploads are complete.
                    </p>

                    {/* Upload progress bar */}
                    <div className="max-w-xs mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Upload Progress</span>
                        <span className="text-xs font-bold text-amber-600">
                          {kycMeta.uploadedRequiredCount}/{kycMeta.requiredCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(kycMeta.uploadedRequiredCount / kycMeta.requiredCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Missing documents list */}
                  {kycMeta.missingTypes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <h5 className="text-sm font-bold text-amber-900 mb-3">Missing Required Documents</h5>
                      <ul className="space-y-2">
                        {kycMeta.missingTypes.map((type) => (
                          <li key={type} className="flex items-center gap-2 text-sm text-amber-700">
                            <XCircle size={14} className="text-amber-400 flex-shrink-0" />
                            {DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Already uploaded docs (read-only preview) */}
                  {kycDocuments.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded So Far</h5>
                      {kycDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
                          <FileText className="text-slate-400" size={18} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">
                              {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-400">{doc.fileName}</p>
                          </div>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Awaiting</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Progress summary */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-sm font-bold text-slate-600">
                      {approvedCount}/{totalCount} documents approved
                    </span>
                    <div className="w-28 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                      <p className="text-xs text-red-700 font-medium flex-1">{error}</p>
                      <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><XCircle size={14} /></button>
                    </div>
                  )}

                  {/* Document cards */}
                  {kycDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                    >
                      {/* Document header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-1">
                            {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <KYCStatusBadge status={doc.status} />
                      </div>

                      {/* File info */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl mb-4">
                        <FileText className="text-slate-400" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{doc.fileName}</p>
                          <p className="text-xs text-slate-500">
                            {(doc.fileSize / 1024).toFixed(1)} KB &bull; {doc.mimeType}
                          </p>
                        </div>
                      </div>

                      {/* Rejection reason */}
                      {doc.status === 'REJECTED' && doc.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                          <p className="text-xs font-bold text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700">{doc.rejectionReason}</p>
                        </div>
                      )}

                      {/* Action buttons for PENDING docs */}
                      {doc.status === 'PENDING' && (
                        <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    setError('')
                                    const resp = await apiClient.get(`/api/v1/admin/kyc-documents/${doc.id}/file`, { responseType: 'blob' as any })
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
                                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                              >
                                <Eye size={16} />
                                View
                              </button>
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={reviewingDocId === doc.id}
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {reviewingDocId === doc.id ? (
                              <RefreshCw className="animate-spin" size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(doc)}
                            disabled={!!reviewingDocId}
                            className="px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* View-only button for already reviewed docs */}
                      {doc.status !== 'PENDING' && (
                        <button
                          onClick={async () => {
                            try {
                              setError('')
                              setViewingDocId(doc.id)
                              const resp = await apiClient.get(`/api/v1/admin/kyc-documents/${doc.id}/file`, { responseType: 'blob' as any })
                              const contentType = (resp.headers && resp.headers['content-type']) || 'application/octet-stream'
                              const blob = new Blob([resp.data], { type: contentType })
                              const url = URL.createObjectURL(blob)
                              window.open(url, '_blank')
                              setTimeout(() => URL.revokeObjectURL(url), 60_000)
                            } catch (err: any) {
                              console.error('Failed to open file', err)
                              setError(err?.response?.data?._clientMessage || err?.message || 'Failed to open document')
                            } finally {
                              setViewingDocId(null)
                            }
                          }}
                          disabled={viewingDocId === doc.id}
                          className="block w-full px-4 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors text-center disabled:opacity-60"
                        >
                          View Document
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && documentToReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Document</h3>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-semibold">{DOCUMENT_TYPE_LABELS[documentToReject.documentType] || documentToReject.documentType}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Please provide a reason for rejecting this document. The partner will see this message.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Document is unclear, please upload a higher quality scan"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 resize-none mb-6"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setDocumentToReject(null); setRejectReason(''); }}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || reviewingDocId === documentToReject.id}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reviewingDocId === documentToReject.id ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Rejecting...
                  </>
                ) : (
                  'Reject Document'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Main Page ─── */
const MerchantPage = ({ onInvite }: { onInvite?: () => void }) => {
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await getAllPartners();
      if (res.success && Array.isArray(res.data)) setPartners(res.data as Partner[]);
      else setPartners([]);
    } catch (err) {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    const handler = () => fetchPartners();
    window.addEventListener('partners:refetch', handler as EventListener);
    return () => window.removeEventListener('partners:refetch', handler as EventListener);
  }, []);

  const shown = partners && partners.length ? (showAll ? partners : partners.slice(0, 4)) : [];

  const openPartner = async (m: any) => {
    if (!m?.id) return;
    setLoadingDetail(true);
    try {
      const res = await getPartnerById(m.id);
      if (res.success && res.data) setSelectedPartner(res.data as Partner);
      else setSelectedPartner(m as Partner);
    } catch (err) {
      setSelectedPartner(m as Partner);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => setSelectedPartner(null);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => onInvite && onInvite()} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl">
          Invite Merchant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 p-6 text-center">Loading partners...</div>
        ) : shown.length ? (
          shown.map((m: any, idx: number) => (
            <PartnerCard key={m.id || idx} m={m} onOpen={openPartner} />
          ))
        ) : (
          <div className="col-span-4 p-10 text-center text-slate-500">No merchants found.</div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        {partners && partners.length > 4 && (
          <button onClick={() => setShowAll(!showAll)} className="text-[10px] font-bold text-emerald-600">{showAll ? 'Show Less' : 'View All'}</button>
        )}
      </div>

      {/* Detail Panel */}
      {selectedPartner && (
        <PartnerDetailPanel
          partner={selectedPartner}
          onClose={closePanel}
          onUpdate={fetchPartners}
        />
      )}
    </div>
  );
};

export default MerchantPage;
