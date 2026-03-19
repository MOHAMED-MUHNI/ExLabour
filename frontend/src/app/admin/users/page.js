'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiSlash, FiUnlock } from 'react-icons/fi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/users';
      if (filter === 'pending') url = '/admin/pending';
      else if (filter !== 'all') url = `/admin/users?status=${filter}`;
      const res = await api.get(url);
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAction = async (userId, action) => {
    try {
      await api.put(`/admin/${action}/${userId}`, { remarks: '' });
      toast.success(`User ${action}ed successfully`);
      loadUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="role-tabs" style={{ maxWidth: '500px', marginBottom: '24px' }}>
        {['pending', 'verified', 'rejected', 'blocked', 'all'].map(f => (
          <button key={f} className={`role-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No users found</h3>
          <p>No users match this filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Docs</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td><span style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                  <td><span className={`badge badge-${u.verificationStatus}`}>{u.verificationStatus}</span></td>
                  <td>
                    {u.role === 'tasker' ? (
                      Array.isArray(u.verificationDocuments) && u.verificationDocuments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {u.verificationDocuments.slice(0, 2).map((doc, index) => (
                            <a
                              key={doc.key || `${doc.url}-${index}`}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted"
                              style={{ fontSize: '0.78rem', textDecoration: 'underline' }}
                            >
                              {doc.originalName || `Document ${index + 1}`}
                            </a>
                          ))}
                          {u.verificationDocuments.length > 2 && (
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              +{u.verificationDocuments.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>No docs</span>
                      )
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>-</span>
                    )}
                  </td>
                  <td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      {u.verificationStatus === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(u._id, 'verify')} title="Verify">
                            <FiCheck />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(u._id, 'reject')} title="Reject">
                            <FiX />
                          </button>
                        </>
                      )}
                      {u.verificationStatus === 'verified' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(u._id, 'block')} title="Block">
                          <FiSlash />
                        </button>
                      )}
                      {u.verificationStatus === 'blocked' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(u._id, 'unblock')} title="Unblock">
                          <FiUnlock />
                        </button>
                      )}
                      {u.verificationStatus === 'rejected' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(u._id, 'verify')} title="Verify">
                          <FiCheck />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
