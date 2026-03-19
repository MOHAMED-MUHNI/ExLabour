'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiUsers, FiBriefcase, FiCheckCircle, FiClock, FiFileText, FiShield } from 'react-icons/fi';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setMetrics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const m = metrics?.metrics;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Platform overview and management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div className="stat-content">
            <h3>{m?.users?.total || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiShield /></div>
          <div className="stat-content">
            <h3>{m?.users?.taskers || 0}</h3>
            <p>Taskers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiClock /></div>
          <div className="stat-content">
            <h3>{m?.users?.pendingVerifications || 0}</h3>
            <p>Pending Verifications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiCheckCircle /></div>
          <div className="stat-content">
            <h3>{m?.tasks?.completed || 0}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2 gap-3">
        {/* Task stats */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            <FiBriefcase style={{ marginRight: '8px' }} /> Tasks
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex justify-between"><span className="text-muted">Total</span><strong>{m?.tasks?.total || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted">Pending Approval</span><strong style={{ color: 'var(--warning)' }}>{m?.tasks?.pending || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted">Active</span><strong style={{ color: 'var(--info)' }}>{m?.tasks?.active || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted">Completed</span><strong style={{ color: 'var(--success)' }}>{m?.tasks?.completed || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted">Total Bids</span><strong>{m?.bids?.total || 0}</strong></div>
          </div>
          <Link href="/admin/tasks" style={{ display: 'block', marginTop: '16px' }}>
            <button className="btn btn-secondary btn-block btn-sm">Manage Tasks</button>
          </Link>
          <Link href="/admin/bids" style={{ display: 'block', marginTop: '8px' }}>
            <button className="btn btn-secondary btn-block btn-sm">View Bids</button>
          </Link>
        </div>

        {/* Recent users */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            <FiUsers style={{ marginRight: '8px' }} /> Recent Users
          </h2>
          {metrics?.recent?.users?.map(u => (
            <div key={u._id} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.name}</div>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>{u.email} • {u.role}</span>
              </div>
              <span className={`badge badge-${u.verificationStatus}`}>{u.verificationStatus}</span>
            </div>
          ))}
          <Link href="/admin/users" style={{ display: 'block', marginTop: '16px' }}>
            <button className="btn btn-secondary btn-block btn-sm">Manage Users</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
