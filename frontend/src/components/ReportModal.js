'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiX, FiSend } from 'react-icons/fi';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Fraud / Scam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'payment_dispute', label: 'Payment Dispute' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ targetUserId, taskId, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error('Please select a reason');
    setSubmitting(true);
    try {
      await api.post('/reports', { targetUserId, taskId, reason, details });
      toast.success('Report submitted. Our team will review it.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '460px', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}
        >
          <FiX />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FiAlertTriangle style={{ color: '#ef4444', fontSize: '1.4rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Report / Dispute</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <select
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Details</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Please describe the issue in detail..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
            />
            <small style={{ color: 'var(--text-secondary)' }}>{details.length}/1000</small>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444' }} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : <><FiSend /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
