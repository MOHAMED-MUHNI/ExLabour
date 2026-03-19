'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { FiArrowLeft, FiDollarSign, FiClock, FiMapPin, FiUser, FiSend, FiPlay, FiCheckCircle, FiPaperclip } from 'react-icons/fi';

export default function TaskerTaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({ amount: '', deliveryDays: '', proposalMessage: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadTask = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch (error) {
      toast.error('Task not found');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

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

  if (loading) return <DashboardLayout><div className="loading-screen"><div className="spinner" /></div></DashboardLayout>;
  if (!task) return null;

  const isAssigned = task.assignedTaskerId?._id === user?._id || task.assignedTaskerId === user?._id;

  return (
    <DashboardLayout>
      <div className="task-detail">
        <a onClick={() => router.back()} className="page-back" style={{ cursor: 'pointer' }}><FiArrowLeft /> Back</a>

        <div className="task-detail-header">
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="task-card-category">{task.category}</span>
            <span className={`badge badge-${task.taskStatus === 'open_for_bidding' ? 'open' : task.taskStatus.replace(/_/g, '-')}`}>
              {task.taskStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <h1>{task.title}</h1>
          <div className="task-detail-meta">
            <div className="meta-item"><FiDollarSign /> ₹{task.budgetMin.toLocaleString()} – ₹{task.budgetMax.toLocaleString()}</div>
            <div className="meta-item"><FiClock /> {new Date(task.deadline).toLocaleDateString()}</div>
            {task.location && <div className="meta-item"><FiMapPin /> {task.location}</div>}
            <div className="meta-item"><FiUser /> {task.userId?.name || 'Unknown'}</div>
          </div>
        </div>

        <div className="task-detail-description">{task.description}</div>

        {Array.isArray(task.attachments) && task.attachments.length > 0 && (
          <div className="card mb-3">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Attachments ({task.attachments.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {task.attachments.map((file, index) => (
                <a
                  key={file.key || `${file.url}-${index}`}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <FiPaperclip /> {file.originalName || `Attachment ${index + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1" style={{ marginBottom: '24px' }}>
          {user?.role === 'tasker' && task.taskStatus === 'open_for_bidding' && (
            <button className="btn btn-primary" onClick={() => setShowBidForm(!showBidForm)}>
              <FiSend /> {showBidForm ? 'Cancel' : 'Place a Bid'}
            </button>
          )}
          {isAssigned && task.taskStatus === 'assigned' && (
            <button className="btn btn-primary" onClick={handleStartTask}><FiPlay /> Start Working</button>
          )}
          {isAssigned && task.taskStatus === 'in_progress' && (
            <button className="btn btn-success" onClick={handleCompleteTask}><FiCheckCircle /> Mark Complete</button>
          )}
        </div>

        {/* Bid form */}
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
      </div>
    </DashboardLayout>
  );
}
