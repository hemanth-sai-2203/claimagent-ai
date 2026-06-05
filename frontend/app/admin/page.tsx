'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { getPolicy, updatePolicy } from '@/lib/apiClient';

export default function AdminPage() {
  const router = useRouter();
  const [policyJson, setPolicyJson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Role check
    const role = localStorage.getItem('claimpilot_role');
    if (role !== 'officer') {
      router.replace('/upload');
      return;
    }

    loadPolicy();
  }, [router]);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const data = await getPolicy();
      setPolicyJson(JSON.stringify(data, null, 2));
      setError(null);
    } catch (err: any) {
      setError('Failed to load policy: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate JSON
      const parsed = JSON.parse(policyJson);
      
      const res = await updatePolicy(parsed);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON formatting. Please check syntax.');
      } else {
        setError('Failed to save policy: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ height: '32px', width: '200px', borderRadius: '6px', marginBottom: '24px' }} className="shimmer" />
        <div style={{ height: '500px', borderRadius: '12px' }} className="shimmer" />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Policy Configuration
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
            Modify the base policy terms, limits, and exclusions. Changes take effect immediately for all new claims.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadPolicy}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} /> Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            Save Policy
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
          <CheckCircle size={18} /> Policy updated successfully. The rules engine is now using the new configuration.
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>policy_terms.json</span>
          <span>JSON Editor</span>
        </div>
        <textarea
          value={policyJson}
          onChange={(e) => setPolicyJson(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            height: '600px',
            padding: '20px',
            background: 'var(--surface)',
            color: 'var(--foreground)',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            fontFamily: 'monospace',
            lineHeight: 1.6,
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}
