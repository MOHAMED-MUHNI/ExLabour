'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiSearch, FiClock, FiDollarSign, FiFileText, FiUser, FiCheck, FiX } from 'react-icons/fi';

const BID_FILTERS = ['all', 'pending', 'accepted', 'rejected', 'withdrawn'];
const TASK_STATUS_OPTIONS = [
  { value: 'all', label: 'All Task States' },
  { value: 'open_for_bidding', label: 'Open for Bidding' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBidsPage() {
  const [bids, setBids] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const getTaskStatusClass = (taskStatus) => {
    if (!taskStatus) return 'open';
    if (taskStatus === 'open_for_bidding') return 'open';
    return taskStatus.replace(/_/g, '-');
  };

  const getTaskStatusLabel = (taskStatus) => {
    if (!taskStatus) return 'open for bidding';
    return taskStatus.replace(/_/g, ' ');
  };

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (taskStatusFilter !== 'all') params.append('taskStatus', taskStatusFilter);
      if (search.trim()) params.append('search', search.trim());

      const query = params.toString();
      const res = await api.get(`/admin/bids${query ? `?${query}` : ''}`);
      setBids(res.data.bids || []);
      setSummary(res.data.summary || { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 });
    } catch (error) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, taskStatusFilter, search]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const handleAdminReview = async (bidId, action) => {
    const message = action === 'approve' ? 'Are you sure you want to approve this bid and assign the tasker?' : 'Are you sure you want to reject this bid?';
    if (!confirm(message)) return;
    try {
      await api.put(`/bids/${bidId}/admin-review`, { action });
      toast.success(`Bid ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadBids();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} bid`);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Bid Monitoring</h1>
          <p>{summary.total} bid{summary.total !== 1 ? 's' : ''} in view</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiFileText /></div>
          <div className="stat-content">
            <h3>{summary.total}</h3>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiClock /></div>
          <div className="stat-content">
            <h3>{summary.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div className="stat-content">
            <h3>{summary.accepted}</h3>
            <p>Accepted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiUser /></div>
          <div className="stat-content">
            <h3>{summary.rejected + summary.withdrawn}</h3>
            <p>Closed</p>
          </div>
        </div>
      </div>

      <div className="role-tabs" style={{ maxWidth: '640px', marginBottom: '12px' }}>
        {BID_FILTERS.map((status) => (
          <button
            key={status}
            className={`role-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="filters-bar" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Search proposal message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={taskStatusFilter}
          onChange={(e) => setTaskStatusFilter(e.target.value)}
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '220px' }}><div className="spinner" /></div>
      ) : bids.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No bids found</h3>
          <p>Try adjusting filters to see more bid activity.</p>
        </div>
      ) : (
        bids.map((bid) => (
          <div key={bid._id} className="bid-card">
            <div className="flex justify-between items-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <Link href={`/dashboard/tasks/${bid.taskId?._id}`} style={{ textDecoration: 'none' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {bid.taskId?.title || 'Unknown Task'}
                  </h4>
                </Link>
                <div className="flex gap-2 mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span><FiDollarSign /> ₹{bid.amount.toLocaleString()}</span>
                  <span><FiClock /> {bid.deliveryDays} days</span>
                  <span>
                    Task: {bid.taskId?.taskStatus?.replace(/_/g, ' ') || 'unknown'}
                  </span>
                </div>
                <div className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tasker: {bid.taskerId?.name || 'Unknown'} ({bid.taskerId?.email || 'N/A'})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Owner: {bid.taskId?.userId?.name || 'Unknown'} ({bid.taskId?.userId?.email || 'N/A'})
                </div>
              </div>

              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <span className={`badge badge-${bid.bidStatus}`}>{bid.bidStatus}</span>
                <span className={`badge badge-${getTaskStatusClass(bid.taskId?.taskStatus)}`}>
                  {getTaskStatusLabel(bid.taskId?.taskStatus)}
                </span>
              </div>
            </div>

            <div className="bid-card-proposal">{bid.proposalMessage}</div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Placed on {new Date(bid.createdAt).toLocaleString()}
            </div>

            {bid.bidStatus === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button 
                  className="btn btn-success btn-sm" 
                  onClick={() => handleAdminReview(bid._id, 'approve')}
                >
                  <FiCheck /> Approve
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => handleAdminReview(bid._id, 'reject')}
                >
                  <FiX /> Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
