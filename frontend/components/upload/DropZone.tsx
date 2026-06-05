'use client';

import { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle, Loader } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface Props {
  onUploadSuccess?: (documentIds: string[]) => void;
}

export default function DropZone({ onUploadSuccess }: Props) {
  const [state, setState] = useState<UploadState>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (selectedFiles: File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const valid = selectedFiles.filter(f => validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024);
    
    if (valid.length === 0) {
      setError('No valid files found. Only images and PDFs under 10MB are supported.');
      return;
    }

    setFiles(valid);
    setError(null);
    setState('uploading');

    // Real upload API call
    try {
      const { uploadDocument } = await import('@/lib/apiClient');
      const uploadedIds: string[] = [];
      for (const f of valid) {
        const res = await uploadDocument(f);
        uploadedIds.push(res.document_id);
      }
      setDocumentIds(uploadedIds);
      setState('success');
      onUploadSuccess?.(uploadedIds);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setState('error');
    }
  }, [onUploadSuccess]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) handleFiles(dropped);
    },
    [handleFiles],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) handleFiles(selected);
  };

  const reset = () => {
    setState('idle');
    setFiles([]);
    setError(null);
    setDocumentIds([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {state === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-2)'}`,
            borderRadius: '12px',
            padding: '56px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(99,102,241,0.05)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={onInputChange}
          />
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <UploadCloud size={28} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            Drag & drop your medical document
          </div>
          <div style={{ fontSize: '13px', color: 'var(--foreground-muted)', marginBottom: '20px' }}>
            Prescription, Medical Bill, Diagnostic Report, or Pharmacy Bill
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <UploadCloud size={15} />
            Browse Files
          </div>
          <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '16px' }}>
            Supported: JPG, PNG, WebP, PDF · Max 10MB
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Loader
              size={36}
              color="var(--primary)"
              style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}
            />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
            Uploading document...
          </div>
          <div style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>
            {files.map(f => f.name).join(', ')}
          </div>
          <div style={{ marginTop: '20px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '60%',
                background: 'var(--primary)',
                borderRadius: '2px',
                animation: 'shimmer 1.5s infinite',
                backgroundSize: '200px 100%',
              }}
            />
          </div>
        </div>
      )}

      {state === 'success' && (
        <div
          style={{
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px',
            padding: '24px',
            background: 'rgba(34,197,94,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <CheckCircle size={22} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e', marginBottom: '4px' }}>
                {files.length} Document(s) uploaded successfully
              </div>
              {files.map((f, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileText size={14} color="var(--foreground-muted)" />
                  <span style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>{f.name}</span>
                </div>
              ))}
              <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)' }}>
                Document IDs: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{documentIds.join(', ')}</span>
              </div>
            </div>
            <button
              onClick={reset}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--foreground-muted)',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '13px',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
