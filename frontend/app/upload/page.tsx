'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Zap, Shield, CheckCircle, ArrowRight, User, Calendar, Building2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import DropZone from '@/components/upload/DropZone';

const PIPELINE_STEPS = [
  { icon: FileText, label: 'Document Upload', desc: 'Prescription, Bill, Report' },
  { icon: Zap, label: 'AI Extraction', desc: 'Gemini 2.5 Flash structured output' },
  { icon: Shield, label: 'Rules Engine', desc: 'Deterministic adjudication' },
  { icon: CheckCircle, label: 'Decision', desc: 'Approved, Rejected, or Partial' },
];

interface ClaimForm {
  member_id: string;
  member_name: string;
  treatment_date: string;
  member_join_date: string;
  hospital: string;
  cashless_request: boolean;
  previous_claims_same_day: number;
  requested_amount: string;
  declaration_signed: boolean;
}

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontSize: '13.5px',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '11.5px',
  fontWeight: 600,
  color: 'var(--foreground-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
};

export default function UploadPage() {
  const router = useRouter();
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [form, setForm] = useState<ClaimForm>({
    member_id: '',
    member_name: '',
    treatment_date: new Date().toISOString().split('T')[0],
    member_join_date: '',
    hospital: '',
    cashless_request: false,
    previous_claims_same_day: 0,
    requested_amount: '',
    declaration_signed: false,
  });

  useEffect(() => {
    const currentCount = parseInt(localStorage.getItem('claimpilot_member_count') || '1', 10);
    setForm((prev) => ({
      ...prev,
      member_id: `MEM-${currentCount.toString().padStart(3, '0')}`,
    }));
    localStorage.setItem('claimpilot_member_count', (currentCount + 1).toString());
  }, []);

  const update = (field: keyof ClaimForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (documentIds.length === 0 || !form.member_name.trim()) return;
    setSubmitting(true);

    try {
      const { extractDocument, adjudicateClaim } = await import('@/lib/apiClient');

      // Step 1: AI Extraction
      setProcessingStep('AI extracting document data...');
      let totalClaimAmount = 0;
      let mergedDocuments: any = { prescription: null, bill: null };

      for (const docId of documentIds) {
        const extractRes: any = await extractDocument(docId);
        if (extractRes?.extracted_data) {
          // Merge prescription
          if (extractRes.extracted_data.prescription && !mergedDocuments.prescription) {
            mergedDocuments.prescription = extractRes.extracted_data.prescription;
          }
          // Merge bill
          if (extractRes.extracted_data.bill) {
            const bill = extractRes.extracted_data.bill;
            if (!mergedDocuments.bill) {
              mergedDocuments.bill = { ...bill };
            } else {
              mergedDocuments.bill.consultation_fee = (mergedDocuments.bill.consultation_fee || 0) + (bill.consultation_fee || 0);
              mergedDocuments.bill.medicines = (mergedDocuments.bill.medicines || 0) + (bill.medicines || 0);
              mergedDocuments.bill.diagnostic_tests = (mergedDocuments.bill.diagnostic_tests || 0) + (bill.diagnostic_tests || 0);
              mergedDocuments.bill.root_canal = (mergedDocuments.bill.root_canal || 0) + (bill.root_canal || 0);
              mergedDocuments.bill.teeth_whitening = (mergedDocuments.bill.teeth_whitening || 0) + (bill.teeth_whitening || 0);
            }
            totalClaimAmount += (bill.consultation_fee || 0) +
              (bill.medicines || 0) +
              (bill.diagnostic_tests || 0) +
              (bill.root_canal || 0) +
              (bill.teeth_whitening || 0);
          }
        }
      }

      // Fallback
      if (totalClaimAmount === 0) totalClaimAmount = 1500;

      // Use user's requested amount as the primary claim amount, fallback to extracted if invalid
      const userRequestedAmount = parseFloat(form.requested_amount);
      const finalAmount = !isNaN(userRequestedAmount) && userRequestedAmount > 0 ? userRequestedAmount : totalClaimAmount;

      // Step 2: Build full claim payload using extracted + form data
      setProcessingStep('Running deterministic rules engine...');
      const claimPayload = {
        document_id: documentIds.join(','),
        claim_data: {
          claim_id: `CLM-${Date.now().toString().slice(-6)}`,
          member_id: form.member_id.trim() || 'MEM-001',
          member_name: form.member_name.trim(),
          treatment_date: form.treatment_date,
          ...(form.member_join_date ? { member_join_date: form.member_join_date } : {}),
          ...(form.hospital.trim() ? { hospital: form.hospital.trim() } : {}),
          cashless_request: form.cashless_request,
          previous_claims_same_day: form.previous_claims_same_day,
          claim_amount: finalAmount > 0 ? finalAmount : 1000,
          documents: mergedDocuments,
        },
      };

      // Step 3: Adjudicate
      setProcessingStep('Generating adjudication decision...');
      const adjResult: any = await adjudicateClaim(claimPayload);

      // Redirect to result page using the claim_id from the adjudication response
      const finalClaimId = adjResult?.claim_id || claimPayload.claim_data.claim_id;
      router.push(`/claim/${finalClaimId}`);
    } catch (e: any) {
      console.error(e);
      alert('Error processing claim: ' + (e.message || 'Server Error'));
      setSubmitting(false);
      setProcessingStep('');
    }
  };

  const canSubmit = documentIds.length > 0 && !!form.member_name.trim() && !!form.requested_amount && form.declaration_signed && !submitting;

  return (
    <div style={{ padding: '40px 48px', maxWidth: '920px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          New Claim
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '10px', letterSpacing: '-0.5px' }}>
          Upload Claim Documents
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--foreground-muted)', maxWidth: '560px', lineHeight: 1.6 }}>
          Upload a medical document, fill in member details, then let AI extract the data and the rules engine adjudicate.
        </p>
      </div>

      {/* Pipeline Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '36px' }}>
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color="var(--primary)" />
                </div>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--foreground-muted)', marginLeft: 'auto' }}>
                  {i + 1}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '3px' }}>{step.label}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--foreground-muted)' }}>{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Upload */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
            Step 1 — Upload Medical Document
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>
            Prescription, bill, diagnostic report, or pharmacy bill
          </p>
        </div>
        <DropZone onUploadSuccess={(ids) => setDocumentIds(ids)} />
      </div>

      {/* Claim Metadata Form */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
            Step 2 — Member & Claim Details
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>
            Fill in the claimant and treatment information for accurate adjudication
          </p>
        </div>

        {/* Row 1: Member Name + Member ID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={11} /> Member Name <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={form.member_name}
              onChange={(e) => update('member_name', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={11} /> Member ID
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. EMP001"
              value={form.member_id}
              onChange={(e) => update('member_id', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
        </div>

        {/* Row 2: Treatment Date + Member Join Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={11} /> Treatment Date <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <input
              type="date"
              value={form.treatment_date}
              onChange={(e) => update('treatment_date', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={11} /> Policy/Join Date
                <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--foreground-subtle)' }}>(for waiting period check)</span>
              </span>
            </label>
            <input
              type="date"
              value={form.member_join_date}
              onChange={(e) => update('member_join_date', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
        </div>

        {/* Row 3: Hospital + Requested Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={11} /> Hospital / Clinic
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Apollo Hospitals"
              value={form.hospital}
              onChange={(e) => update('hospital', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={11} /> Requested Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={form.requested_amount}
              onChange={(e) => update('requested_amount', e.target.value)}
              style={FIELD_STYLE}
            />
          </div>
        </div>

        {/* Cashless Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => update('cashless_request', !form.cashless_request)}
        >
          {form.cashless_request
            ? <ToggleRight size={24} color="var(--primary)" />
            : <ToggleLeft size={24} color="var(--foreground-muted)" />
          }
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)' }}>Cashless Request</div>
            <div style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
              {form.cashless_request ? 'Cashless processing enabled — network discount will apply' : 'Standard reimbursement claim'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
            background: form.cashless_request ? 'rgba(99,102,241,0.15)' : 'var(--surface)',
            color: form.cashless_request ? 'var(--primary)' : 'var(--foreground-muted)',
            border: `1px solid ${form.cashless_request ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
          }}>
            {form.cashless_request ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>

      {/* Legal Declaration */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: form.declaration_signed ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
          border: `1px solid ${form.declaration_signed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => update('declaration_signed', !form.declaration_signed)}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: `2px solid ${form.declaration_signed ? '#22c55e' : '#f59e0b'}`,
            background: form.declaration_signed ? '#22c55e' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
            transition: 'all 0.15s',
          }}
        >
          {form.declaration_signed && <CheckCircle size={14} color="#fff" />}
        </div>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
            Legal Declaration & Consent <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
            I hereby declare that the information and documents provided are genuine and true to the best of my knowledge. I understand that submitting fraudulent or altered documents is illegal and may result in immediate rejection of my claim and termination of my policy.
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
        {submitting && processingStep && (
          <div style={{ fontSize: '13px', color: 'var(--foreground-muted)', fontStyle: 'italic' }}>
            ⏳ {processingStep}
          </div>
        )}
        {documentIds.length === 0 && (
          <div style={{ fontSize: '12.5px', color: 'var(--foreground-subtle)' }}>
            Upload at least one document first
          </div>
        )}
        {documentIds.length > 0 && (!form.member_name.trim() || !form.requested_amount || !form.declaration_signed) && (
          <div style={{ fontSize: '12.5px', color: '#f59e0b' }}>
            Please fill all required fields (*) and sign the declaration.
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '13px 28px',
            borderRadius: '8px',
            background: !canSubmit ? 'var(--border-2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            cursor: !canSubmit ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: !canSubmit ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
            opacity: !canSubmit ? 0.6 : 1,
          }}
        >
          {submitting ? 'Processing...' : 'Extract & Adjudicate'}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
