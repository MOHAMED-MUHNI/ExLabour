'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiDollarSign, FiClock, FiMapPin, FiUser, FiCheck, FiX, FiPlay, FiCheckCircle, FiPaperclip, FiSlash } from 'react-icons/fi';

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleAcceptBid = async (bidId) => {
    if (!confirm('Accept this bid? All other bids will be rejected.')) return;
    try {
      await api.put(`/bids/${bidId}/accept`);
      toast.success('Bid accepted! Tasker assigned.');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm('Reject this bid?')) return;
    try {
      await api.put(`/bids/${bidId}/reject`);
      toast.success('Bid rejected.');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject bid');
    }
  };

  const handleStartTask = async () => {
    try {
      await api.put(`/bids/task/${id}/start`);
      toast.success('Task marked as in progress');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start task');
    }
  };

  const handleCompleteTask = async () => {
    try {
      await api.put(`/bids/task/${id}/complete`);
      toast.success('Task completed! 🎉');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      router.push('/dashboard/my-tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleCancelTask = async () => {
    if (!confirm('Cancel this task? This will stop further bidding and work progress.')) return;
    try {
      await api.put(`/tasks/${id}/cancel`);
      toast.success('Task cancelled');
      loadTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel task');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!task) return null;

  const isOwner = user?._id === task.userId?._id;
  const isAssignedTasker = user?._id === task.assignedTaskerId?._id;
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="task-detail">
      <a onClick={() => router.back()} className="page-back" style={{ cursor: 'pointer' }}><FiArrowLeft /> Back</a>

      <div className="task-detail-header">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <span className="task-card-category">{task.category}</span>
          <div className="flex gap-1">
            <span className={`badge badge-${task.approvalStatus === 'approved' ? 'approved' : task.approvalStatus === 'pending_admin_approval' ? 'pending' : 'rejected'}`}>
              {task.approvalStatus === 'pending_admin_approval' ? 'pending' : task.approvalStatus}
            </span>
            <span className={`badge badge-${task.taskStatus === 'open_for_bidding' ? 'open' : task.taskStatus.replace(/_/g, '-')}`}>
              {task.taskStatus.replace(/_/g, ' ')}
            </span>
          </div>
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
      <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: '24px' }}>
        {isAssignedTasker && task.taskStatus === 'assigned' && (
          <button className="btn btn-primary" onClick={handleStartTask}><FiPlay /> Start Working</button>
        )}
        {(isOwner || isAssignedTasker) && task.taskStatus === 'in_progress' && (
          <button className="btn btn-success" onClick={handleCompleteTask}><FiCheckCircle /> Mark Complete</button>
        )}
        {isOwner && !['completed', 'cancelled'].includes(task.taskStatus) && (
          <button className="btn btn-secondary btn-sm" onClick={handleCancelTask}><FiSlash /> Cancel Task</button>
        )}
        {isOwner && !['assigned', 'in_progress'].includes(task.taskStatus) && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteTask}><FiX /> Delete Task</button>
        )}
      </div>

      {/* Assigned tasker info */}
      {task.assignedTaskerId && (
        <div className="card mb-3">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Assigned Tasker</h2>
          <div className="bid-card-header">
            <div className="bid-card-avatar">
              {task.assignedTaskerId.profileImage
                ? (
                  <Image
                    src={task.assignedTaskerId.profileImage}
                    alt={task.assignedTaskerId.name}
                    width={40}
                    height={40}
                    unoptimized
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
                : getInitials(task.assignedTaskerId.name)}
            </div>
            <div className="bid-card-info">
              <h4>{task.assignedTaskerId.name}</h4>
              <span>{task.assignedTaskerId.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bids section */}
      {bids.length > 0 && (
        <div className="task-detail-section">
          <h2>Bids ({bids.length})</h2>
          {bids.map(bid => (
            <div key={bid._id} className="bid-card">
              <div className="flex justify-between items-center">
                <div className="bid-card-header" style={{ marginBottom: 0 }}>
                  <div className="bid-card-avatar">
                    {bid.taskerId?.profileImage
                      ? (
                        <Image
                          src={bid.taskerId.profileImage}
                          alt={bid.taskerId?.name || 'Tasker profile image'}
                          width={40}
                          height={40}
                          unoptimized
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )
                      : getInitials(bid.taskerId?.name)}
                  </div>
                  <div className="bid-card-info">
                    <h4>{bid.taskerId?.name || 'Unknown'}</h4>
                    <span>{bid.taskerId?.skills?.join(', ') || 'No skills listed'}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bid-card-amount">₹{bid.amount.toLocaleString()}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bid.deliveryDays} days</span>
                </div>
              </div>
              <div className="bid-card-proposal">{bid.proposalMessage}</div>
              <div className="flex justify-between items-center">
                <span className={`badge badge-${bid.bidStatus}`}>{bid.bidStatus}</span>
                {isOwner && bid.bidStatus === 'pending' && task.taskStatus === 'open_for_bidding' && (
                  <div className="flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={() => handleAcceptBid(bid._id)}>
                      <FiCheck /> Accept
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRejectBid(bid._id)}>
                      <FiX /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
