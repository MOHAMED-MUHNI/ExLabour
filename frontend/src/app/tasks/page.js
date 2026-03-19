'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { FiSearch, FiClock, FiDollarSign, FiMapPin, FiFilter } from 'react-icons/fi';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'it-support', label: 'IT Support' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing' },
  { value: 'moving', label: 'Moving' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'photography', label: 'Photography' },
  { value: 'other', label: 'Other' },
];

export default function BrowseTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', location: '', category: '', sort: '' });

  const loadTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.category) params.append('category', filters.category);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await api.get(`/tasks/approved?${params.toString()}`);
      setTasks(res.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <DashboardLayout>
      <div>
        <div className="dashboard-header">
          <div>
            <h1>Browse Tasks</h1>
            <p>Find tasks that match your skills</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '40px', width: '100%' }}
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FiMapPin style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '40px', width: '100%' }}
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          <select className="form-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="">Newest First</option>
            <option value="budget_high">Highest Budget</option>
            <option value="budget_low">Lowest Budget</option>
            <option value="deadline">Earliest Deadline</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No tasks found</h3>
            <p>Try adjusting your filters or check back later for new tasks.</p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map(task => (
              <Link key={task._id} href={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
                <div className="task-card">
                  <div className="task-card-header">
                    <span className="task-card-category">{task.category}</span>
                    <span className="badge badge-open">{task.bidCount || 0} bids</span>
                  </div>
                  <h3>{task.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '4px' }}>
                    {task.description.substring(0, 120)}{task.description.length > 120 ? '...' : ''}
                  </p>
                  <div className="task-card-meta">
                    <span className="task-card-budget"><FiDollarSign /> ₹{task.budgetMin.toLocaleString()} – ₹{task.budgetMax.toLocaleString()}</span>
                    <span><FiClock /> {new Date(task.deadline).toLocaleDateString()}</span>
                    {task.location && <span><FiMapPin /> {task.location}</span>}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Posted by {task.userId?.name || 'Unknown'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
