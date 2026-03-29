'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList from '@/components/ReviewsList';
import ReportModal from '@/components/ReportModal';
import {
  FiArrowLeft, FiDollarSign, FiClock, FiMapPin, FiUser, FiSend,
  FiPlay, FiCheckCircle, FiPaperclip, FiMessageSquare, FiAlertTriangle,
  FiShield,
} from 'react-icons/fi';
import Link from 'next/link';

const PAYMENT_COLORS = {
  unpaid: '#ef4444',
  escrowed: '#f59e0b',
  released: '#10b981',
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({ amount: '', deliveryDays: '', proposalMessage: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const loadTask = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
      setBids(res.data.bids || []);
    } catch (error) {
      toast.error('Task not found');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadTask(); }, [loadTask]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/bids', {
        taskId: id,
        amount: Number(bidData.amount),
        deliveryDays: Number(bidData.deliveryDays),
        proposalMessage: bidData.proposalMessage,
      });
      toast.success('Bid placed successfully!');
      setShowBidForm(false);
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/accept`);
      toast.success('Bid accepted! Tasker has been assigned.');
      loadTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/reject`);
      toast.success('Bid rejected.');
      loadTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleStartTask = async () => {
    try {
      await api.put(`/bids/task/${id}/start`);
      toast.success('Task started!');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleCompleteTask = async () => {
    try {
      await api.put(`/bids/task/${id}/complete`);
      toast.success('Task completed! 🎉');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleEscrow = async () => {
    toast('💳 Payment/escrow integration coming soon!', { icon: 'ℹ️' });
  };

  if (loading) return <DashboardLayout><div className="loading-screen"><div className="spinner" /></div></DashboardLayout>;
  if (!task) return null;

  const isOwner = task.userId?._id === user?._id || task.userId === user?._id;
  const isAssigned = task.assignedTaskerId?._id === user?._id || task.assignedTaskerId === user?._id;
  const isCompleted = task.taskStatus === 'completed';
  const hasAssignment = task.assignedTaskerId;
  const chatPartnerId = isOwner ? task.assignedTaskerId?._id || task.assignedTaskerId : task.userId?._id || task.userId;

  return (
    <DashboardLayout>
      <div className="task-detail">
        <a onClick={() => router.back()} className="page-back" style={{ cursor: 'pointer' }}><FiArrowLeft /> Back</a>

        {/* Task Header */}
        <div className="task-detail-header">
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="task-card-category">{task.category}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${task.taskStatus === 'open_for_bidding' ? 'open' : task.taskStatus.replace(/_/g, '-')}`}>
                {task.taskStatus.replace(/_/g, ' ')}
              </span>
              {/* Payment Status Badge */}
              <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                background: `${PAYMENT_COLORS[task.paymentStatus]}22`,
                color: PAYMENT_COLORS[task.paymentStatus],
                border: `1px solid ${PAYMENT_COLORS[task.paymentStatus]}44`,
              }}>
                💰 {task.paymentStatus}
              </span>
            </div>
          </div>
          <h1>{task.title}</h1>
          <div className="task-detail-meta">
            <div className="meta-item"><FiDollarSign /> ₹{task.budgetMin?.toLocaleString()} – ₹{task.budgetMax?.toLocaleString()}</div>
            <div className="meta-item"><FiClock /> {new Date(task.deadline).toLocaleDateString()}</div>
            {task.location && <div className="meta-item"><FiMapPin /> {task.location}</div>}
            <div className="meta-item"><FiUser /> {task.userId?.name || 'Unknown'}</div>
          </div>
        </div>

        <div className="task-detail-description">{task.description}</div>

        {/* Attachments */}
        {Array.isArray(task.attachments) && task.attachments.length > 0 && (
          <div className="card mb-3">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Attachments ({task.attachments.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {task.attachments.map((file, index) => (
                <a key={file.key || `${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  <FiPaperclip /> {file.originalName || `Attachment ${index + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Tasker bidding */}
          {user?.role === 'tasker' && task.taskStatus === 'open_for_bidding' && (
            <button className="btn btn-primary" onClick={() => setShowBidForm(!showBidForm)}>
              <FiSend /> {showBidForm ? 'Cancel' : 'Place a Bid'}
            </button>
          )}
          {/* Tasker: start / complete */}
          {isAssigned && task.taskStatus === 'assigned' && (
            <button className="btn btn-primary" onClick={handleStartTask}><FiPlay /> Start Working</button>
          )}
          {isAssigned && task.taskStatus === 'in_progress' && (
            <button className="btn btn-success" onClick={handleCompleteTask}><FiCheckCircle /> Mark Complete</button>
          )}
          {/* Owner: Leave Review after completion */}
          {isOwner && isCompleted && (
            <button className="btn btn-secondary" onClick={() => setShowReviewForm(true)}>
              ⭐ Leave a Review
            </button>
          )}
          {isAssigned && isCompleted && (
            <button className="btn btn-secondary" onClick={() => setShowReviewForm(true)}>
              ⭐ Leave a Review
            </button>
          )}
          {/* Chat button (only when task is assigned and both parties exist) */}
          {hasAssignment && (isOwner || isAssigned) && (
            <Link href={`/dashboard/chat/${id}`} className="btn btn-secondary">
              <FiMessageSquare /> Chat
            </Link>
          )}
          {/* Payment escrow placeholder (owner only, when assigned) */}
          {isOwner && hasAssignment && task.paymentStatus === 'unpaid' && (
            <button className="btn btn-secondary" onClick={handleEscrow}>
              <FiShield /> Escrow Payment
            </button>
          )}
          {/* Report button */}
          {!isOwner && (
            <button
              className="btn btn-secondary"
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => setShowReportModal(true)}
            >
              <FiAlertTriangle /> Report
            </button>
          )}
        </div>

        {/* Bid Form */}
        {showBidForm && (
          <div className="card mb-3">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Place Your Bid</h2>
            <form onSubmit={handleBidSubmit}>
              <div className="grid grid-2 gap-2">
                <div className="form-group">
                  <label className="form-label">Bid Amount (₹)</label>
                  <input type="number" className="form-input" placeholder="2500" value={bidData.amount}
                    onChange={(e) => setBidData({ ...bidData, amount: e.target.value })} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery (days)</label>
                  <input type="number" className="form-input" placeholder="5" value={bidData.deliveryDays}
                    onChange={(e) => setBidData({ ...bidData, deliveryDays: e.target.value })} required min="1" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Proposal Message</label>
                <textarea className="form-textarea" placeholder="Why are you the best fit for this task?"
                  value={bidData.proposalMessage} onChange={(e) => setBidData({ ...bidData, proposalMessage: e.target.value })}
                  required rows={4} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : <><FiSend /> Submit Bid</>}
              </button>
            </form>
          </div>
        )}

        {/* Bids List (task owner sees all bids) */}
        {isOwner && bids.length > 0 && (
          <div className="card mb-3">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Proposals ({bids.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bids.map((bid) => (
                <div key={bid._id} style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{bid.taskerId?.name}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{bid.taskerId?.bio || 'No bio provided'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--accent)', margin: 0 }}>₹{bid.amount?.toLocaleString()}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0 0' }}>{bid.deliveryDays} days</p>
                    </div>
                  </div>
                  <p style={{ margin: '12px 0', fontSize: '0.9rem', lineHeight: 1.6 }}>{bid.proposalMessage}</p>
                  {bid.bidStatus === 'pending' && task.taskStatus === 'open_for_bidding' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAcceptBid(bid._id)}>✓ Accept</button>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => handleRejectBid(bid._id)}>✗ Reject</button>
                    </div>
                  )}
                  {bid.bidStatus !== 'pending' && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: bid.bidStatus === 'accepted' ? '#10b981' : '#ef4444' }}>
                      {bid.bidStatus.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="card mb-3">
            <ReviewForm
              taskId={id}
              targetUserId={isOwner ? (task.assignedTaskerId?._id || task.assignedTaskerId) : (task.userId?._id || task.userId)}
              onSuccess={() => { setShowReviewForm(false); toast.success('Review submitted!'); }}
            />
          </div>
        )}

        {/* Reviews Section */}
        {isCompleted && (
          <div className="card mb-3">
            <ReviewsList taskId={id} />
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetUserId={chatPartnerId}
          taskId={id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
