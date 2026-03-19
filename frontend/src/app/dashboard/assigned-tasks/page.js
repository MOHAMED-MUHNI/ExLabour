'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiPlay,
  FiUser,
} from 'react-icons/fi';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const prettyStatus = (status = '') => status.replace(/_/g, ' ');

export default function AssignedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionTaskId, setActionTaskId] = useState(null);

  useEffect(() => {
    const loadAssignedTasks = async () => {
      try {
        const res = await api.get('/tasks/assigned');
        setTasks(res.data.tasks || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load assigned tasks');
      } finally {
        setLoading(false);
      }
    };

    loadAssignedTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((task) => task.taskStatus === statusFilter);
  }, [tasks, statusFilter]);

  const updateTaskStatus = (taskId, nextStatus) => {
    setTasks((prev) => prev.map((task) => (
      task._id === taskId ? { ...task, taskStatus: nextStatus } : task
    )));
  };

  const handleStartTask = async (taskId) => {
    setActionTaskId(taskId);
    try {
      const res = await api.put(`/bids/task/${taskId}/start`);
      updateTaskStatus(taskId, res.data.task?.taskStatus || 'in_progress');
      toast.success('Task marked as in progress');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start task');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setActionTaskId(taskId);
    try {
      const res = await api.put(`/bids/task/${taskId}/complete`);
      updateTaskStatus(taskId, res.data.task?.taskStatus || 'completed');
      toast.success('Task marked as completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    } finally {
      setActionTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Assigned Tasks</h1>
          <p>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} in this view</p>
        </div>
      </div>

      <div className="flex gap-1" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={statusFilter === filter.key ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setStatusFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧰</div>
          <h3>No assigned tasks found</h3>
          <p>Tasks you win will appear here so you can manage progress.</p>
          <Link href="/tasks">
            <button className="btn btn-primary">
              <FiBriefcase /> Browse Tasks
            </button>
          </Link>
        </div>
      ) : (
        filteredTasks.map((task) => {
          const isBusy = actionTaskId === task._id;

          return (
            <div key={task._id} className="bid-card">
              <div className="flex justify-between items-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <Link href={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</h4>
                  </Link>

                  <div className="flex gap-2 mt-1" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span><FiDollarSign /> ₹{task.budgetMin?.toLocaleString()} – ₹{task.budgetMax?.toLocaleString()}</span>
                    <span><FiClock /> Due {new Date(task.deadline).toLocaleDateString()}</span>
                    {task.location ? <span><FiMapPin /> {task.location}</span> : null}
                    {task.userId?.name ? <span><FiUser /> {task.userId.name}</span> : null}
                  </div>

                  <p className="bid-card-proposal">{task.description}</p>
                </div>

                <div className="flex gap-1 items-center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className={`badge badge-${task.taskStatus.replace(/_/g, '-')}`}>{prettyStatus(task.taskStatus)}</span>
                  <Link href={`/tasks/${task._id}`}>
                    <button className="btn btn-secondary btn-sm" type="button">Open</button>
                  </Link>

                  {task.taskStatus === 'assigned' && (
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStartTask(task._id)}
                    >
                      <FiPlay /> {isBusy ? 'Starting...' : 'Start'}
                    </button>
                  )}

                  {task.taskStatus === 'in_progress' && (
                    <button
                      className="btn btn-success btn-sm"
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteTask(task._id)}
                    >
                      <FiCheckCircle /> {isBusy ? 'Completing...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
