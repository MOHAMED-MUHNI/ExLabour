'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

const STATUS_COLORS = {
  open: '#ef4444',
  under_review: '#f59e0b',
  resolved: '#10b981',
  dismissed: '#6b7280',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports?status=${filter}`);
      setReports(res.data.reports);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleUpdate = async (id, status, adminNotes = '') => {
    try {
      await api.put(`/reports/${id}`, { status, adminNotes });
      toast.success(`Report marked as ${status}`);
      load();
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiAlertTriangle style={{ color: '#ef4444' }} /> Reports &amp; Disputes</h1>
          <p className="page-subtitle">Review and action user-submitted reports</p>
        </div>
        <button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['open', 'under_review', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <FiAlertTriangle style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No {filter.replace('_', ' ')} reports</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((r) => (
            <div key={r._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                    background: `${STATUS_COLORS[r.status]}22`, color: STATUS_COLORS[r.status],
                    border: `1px solid ${STATUS_COLORS[r.status]}44`,
                    marginRight: '8px',
                  }}>
                    {r.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: '20px' }}>
                    {r.reason.replace('_', ' ')}
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '0.9rem' }}>
                <div><strong>Reporter:</strong> {r.reporterId?.name} ({r.reporterId?.email})</div>
                {r.targetUserId && <div><strong>Reported User:</strong> {r.targetUserId?.name} ({r.targetUserId?.email})</div>}
                {r.taskId && <div><strong>Task:</strong> {r.taskId?.title}</div>}
              </div>

              {r.details && (
                <p style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', margin: '0 0 12px' }}>
                  {r.details}
                </p>
              )}

              {r.status === 'open' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleUpdate(r._id, 'under_review')}>
                    🔍 Mark Under Review
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(r._id, 'resolved')}>
                    ✓ Resolve
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ color: '#6b7280' }} onClick={() => handleUpdate(r._id, 'dismissed')}>
                    ✗ Dismiss
                  </button>
                </div>
              )}
              {r.status === 'under_review' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(r._id, 'resolved')}>✓ Resolve</button>
                  <button className="btn btn-secondary btn-sm" style={{ color: '#6b7280' }} onClick={() => handleUpdate(r._id, 'dismissed')}>✗ Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
