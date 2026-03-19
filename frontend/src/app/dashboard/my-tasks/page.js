'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FiPlus, FiClock, FiDollarSign, FiMapPin } from 'react-icons/fi';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/my')
      .then(res => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>My Tasks</h1>
          <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link href="/dashboard/tasks/new">
          <button className="btn btn-primary"><FiPlus /> New Task</button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Post your first task and start receiving bids.</p>
          <Link href="/dashboard/tasks/new"><button className="btn btn-primary"><FiPlus /> Post a Task</button></Link>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map(task => (
            <Link key={task._id} href={`/dashboard/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
              <div className="task-card">
                <div className="task-card-header">
                  <span className="task-card-category">{task.category}</span>
                  <div className="flex gap-1">
                    <span className={`badge badge-${task.approvalStatus === 'approved' ? 'approved' : task.approvalStatus === 'pending_admin_approval' ? 'pending' : 'rejected'}`}>
                      {task.approvalStatus === 'pending_admin_approval' ? 'pending' : task.approvalStatus}
                    </span>
                  </div>
                </div>
                <h3>{task.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '4px' }}>
                  {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                </p>
                <div className="task-card-meta">
                  <span className="task-card-budget"><FiDollarSign /> ₹{task.budgetMin.toLocaleString()} – ₹{task.budgetMax.toLocaleString()}</span>
                  <span><FiClock /> {new Date(task.deadline).toLocaleDateString()}</span>
                  {task.location && <span><FiMapPin /> {task.location}</span>}
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {task.bidCount || 0} bid{task.bidCount !== 1 ? 's' : ''} • Status: {task.taskStatus.replace(/_/g, ' ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
