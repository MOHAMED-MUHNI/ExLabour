'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FiPlus, FiList, FiBriefcase, FiClock, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], bids: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (user.role === 'user') {
        const res = await api.get('/tasks/my');
        setStats({ tasks: res.data.tasks, bids: [] });
      } else if (user.role === 'tasker') {
        const res = await api.get('/bids/my');
        setStats({ tasks: [], bids: res.data.bids });
      }
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isTasker = user?.role === 'tasker';

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p>
            {user?.verificationStatus === 'pending'
              ? '⏳ Your account is pending admin verification.'
              : user?.verificationStatus === 'verified'
              ? '✅ Your account is verified.'
              : `⚠️ Account status: ${user?.verificationStatus}`
            }
          </p>
        </div>
        {!isTasker && (
          <Link href="/dashboard/tasks/new">
            <button className="btn btn-primary"><FiPlus /> Post a Task</button>
          </Link>
        )}
      </div>

      {/* Quick stats */}
      <div className="stat-grid">
        {!isTasker ? (
          <>
            <div className="stat-card">
              <div className="stat-icon purple"><FiList /></div>
              <div className="stat-content">
                <h3>{stats.tasks.length}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><FiClock /></div>
              <div className="stat-content">
                <h3>{stats.tasks.filter(t => t.taskStatus === 'open_for_bidding').length}</h3>
                <p>Open for Bidding</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><FiBriefcase /></div>
              <div className="stat-content">
                <h3>{stats.tasks.filter(t => ['assigned', 'in_progress'].includes(t.taskStatus)).length}</h3>
                <p>In Progress</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FiCheckCircle /></div>
              <div className="stat-content">
                <h3>{stats.tasks.filter(t => t.taskStatus === 'completed').length}</h3>
                <p>Completed</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon purple"><FiList /></div>
              <div className="stat-content">
                <h3>{stats.bids.length}</h3>
                <p>Total Bids</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><FiClock /></div>
              <div className="stat-content">
                <h3>{stats.bids.filter(b => b.bidStatus === 'pending').length}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FiCheckCircle /></div>
              <div className="stat-content">
                <h3>{stats.bids.filter(b => b.bidStatus === 'accepted').length}</h3>
                <p>Accepted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><FiDollarSign /></div>
              <div className="stat-content">
                <h3>₹{stats.bids.filter(b => b.bidStatus === 'accepted').reduce((s, b) => s + b.amount, 0).toLocaleString()}</h3>
                <p>Earnings</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent items */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
          {isTasker ? 'Recent Bids' : 'Recent Tasks'}
        </h2>

        {!isTasker && stats.tasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Post your first task and start receiving bids from verified taskers.</p>
            <Link href="/dashboard/tasks/new">
              <button className="btn btn-primary"><FiPlus /> Post a Task</button>
            </Link>
          </div>
        )}

        {isTasker && stats.bids.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No bids yet</h3>
            <p>Browse available tasks and place your first bid.</p>
            <Link href="/tasks">
              <button className="btn btn-primary"><FiBriefcase /> Browse Tasks</button>
            </Link>
          </div>
        )}

        {!isTasker && stats.tasks.slice(0, 5).map((task) => (
          <Link key={task._id} href={`/dashboard/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
            <div className="bid-card" style={{ cursor: 'pointer' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 style={{ fontWeight: 600 }}>{task.title}</h4>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                    {task.category} • {task.bidCount || 0} bids
                  </span>
                </div>
                <div className="flex gap-1 items-center">
                  <span className={`badge badge-${task.approvalStatus === 'approved' ? 'approved' : task.approvalStatus === 'pending_admin_approval' ? 'pending' : 'rejected'}`}>
                    {task.approvalStatus === 'pending_admin_approval' ? 'pending' : task.approvalStatus}
                  </span>
                  <span className={`badge badge-${task.taskStatus === 'open_for_bidding' ? 'open' : task.taskStatus.replace('_', '-')}`}>
                    {task.taskStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {isTasker && stats.bids.slice(0, 5).map((bid) => (
          <div key={bid._id} className="bid-card">
            <div className="flex justify-between items-center">
              <div>
                <h4 style={{ fontWeight: 600 }}>{bid.taskId?.title || 'Unknown Task'}</h4>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                  ₹{bid.amount.toLocaleString()} • {bid.deliveryDays} days
                </span>
              </div>
              <span className={`badge badge-${bid.bidStatus}`}>{bid.bidStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
