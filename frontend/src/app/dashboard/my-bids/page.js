'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FiClock, FiDollarSign, FiEdit2, FiX } from 'react-icons/fi';

export default function MyBidsPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBidId, setEditingBidId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', deliveryDays: '', proposalMessage: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get('/bids/my')
      .then(res => setBids(res.data.bids))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (bidId) => {
    if (!confirm('Withdraw this bid?')) return;
    try {
      await api.put(`/bids/${bidId}/withdraw`);
      setBids((prev) => prev.map((b) => (b._id === bidId ? { ...b, bidStatus: 'withdrawn' } : b)));
    } catch (error) {
      const toast = (await import('react-hot-toast')).default;
      toast.error(error.response?.data?.message || 'Failed to withdraw bid');
    }
  };

  const handleStartEdit = (bid) => {
    setEditingBidId(bid._id);
    setEditForm({
      amount: String(bid.amount),
      deliveryDays: String(bid.deliveryDays),
      proposalMessage: bid.proposalMessage || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBidId(null);
    setEditForm({ amount: '', deliveryDays: '', proposalMessage: '' });
  };

  const handleUpdateBid = async (bidId) => {
    const amount = Number(editForm.amount);
    const deliveryDays = Number(editForm.deliveryDays);
    const proposalMessage = editForm.proposalMessage.trim();

    if (!Number.isFinite(amount) || amount < 0) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (!Number.isInteger(deliveryDays) || deliveryDays < 1) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Delivery days must be at least 1');
      return;
    }

    if (!proposalMessage) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Proposal message is required');
      return;
    }

    setUpdating(true);
    try {
      const res = await api.put(`/bids/${bidId}`, { amount, deliveryDays, proposalMessage });
      setBids((prev) => prev.map((b) => (b._id === bidId ? { ...b, ...res.data.bid } : b)));
      setEditingBidId(null);
      setEditForm({ amount: '', deliveryDays: '', proposalMessage: '' });
      const toast = (await import('react-hot-toast')).default;
      toast.success('Bid updated');
    } catch (error) {
      const toast = (await import('react-hot-toast')).default;
      toast.error(error.response?.data?.message || 'Failed to update bid');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>My Bids</h1>
          <p>{bids.length} bid{bids.length !== 1 ? 's' : ''} placed</p>
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No bids yet</h3>
          <p>Browse tasks and place your bids to start earning.</p>
          <Link href="/tasks"><button className="btn btn-primary">Browse Tasks</button></Link>
        </div>
      ) : (
        bids.map(bid => (
          <div key={bid._id} className="bid-card">
            <div className="flex justify-between items-center">
              <div style={{ flex: 1 }}>
                <Link href={`/tasks/${bid.taskId?._id}`} style={{ textDecoration: 'none' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bid.taskId?.title || 'Unknown Task'}</h4>
                </Link>
                {editingBidId === bid._id ? (
                  <div className="mt-2" style={{ maxWidth: '520px' }}>
                    <div className="grid grid-2 gap-1 mb-1">
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="Amount"
                        value={editForm.amount}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Delivery days"
                        value={editForm.deliveryDays}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, deliveryDays: e.target.value }))}
                      />
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Proposal message"
                      value={editForm.proposalMessage}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, proposalMessage: e.target.value }))}
                    />
                    <div className="flex gap-1 mt-1">
                      <button className="btn btn-primary btn-sm" disabled={updating} onClick={() => handleUpdateBid(bid._id)}>
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn btn-secondary btn-sm" disabled={updating} onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mt-1" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span><FiDollarSign /> ₹{bid.amount.toLocaleString()}</span>
                      <span><FiClock /> {bid.deliveryDays} days</span>
                    </div>
                    <p className="bid-card-proposal">{bid.proposalMessage}</p>
                  </>
                )}
              </div>
              <div className="flex gap-1 items-center">
                <span className={`badge badge-${bid.bidStatus}`}>{bid.bidStatus}</span>
                {bid.bidStatus === 'pending' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStartEdit(bid)} disabled={editingBidId === bid._id}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleWithdraw(bid._id)} disabled={editingBidId === bid._id}>
                      <FiX /> Withdraw
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
