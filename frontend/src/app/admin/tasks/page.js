'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiDollarSign, FiClock } from 'react-icons/fi';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (filter === 'pending') {
        res = await api.get('/tasks/pending');
      } else {
        res = await api.get('/tasks/approved');
      }
      setTasks(res.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleApprove = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/approve`);
      toast.success('Task approved');
      loadTasks();
    } catch (error) {
      toast.error('Failed to approve task');
    }
  };

  const handleReject = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/reject`);
      toast.success('Task rejected');
      loadTasks();
    } catch (error) {
      toast.error('Failed to reject task');
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Task Management</h1>
          <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="role-tabs" style={{ maxWidth: '300px', marginBottom: '24px' }}>
        <button className={`role-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          Pending Approval
        </button>
        <button className={`role-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
          Approved
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks</h3>
          <p>{filter === 'pending' ? 'No tasks pending approval.' : 'No approved tasks.'}</p>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map(task => (
            <div key={task._id} className="task-card" style={{ cursor: 'default' }}>
              <div className="task-card-header">
                <span className="task-card-category">{task.category}</span>
                <span className={`badge badge-${filter === 'pending' ? 'pending' : 'approved'}`}>
                  {filter === 'pending' ? 'pending' : 'approved'}
                </span>
              </div>
              <h3>{task.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '4px' }}>
                {task.description?.substring(0, 120)}{task.description?.length > 120 ? '...' : ''}
              </p>
              <div className="task-card-meta">
                <span className="task-card-budget"><FiDollarSign /> ₹{task.budgetMin?.toLocaleString()} – ₹{task.budgetMax?.toLocaleString()}</span>
                <span><FiClock /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Posted by {task.userId?.name || 'Unknown'} • {task.userId?.email || ''}
              </div>
              {filter === 'pending' && (
                <div className="flex gap-1 mt-2">
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(task._id)}>
                    <FiCheck /> Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReject(task._id)}>
                    <FiX /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
