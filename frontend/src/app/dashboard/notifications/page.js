"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Trash2 } from 'react-feather';
import styles from './page.module.css';

const notificationTypeIcons = {
  bid_placed: '💰',
  bid_accepted: '✅',
  bid_rejected: '❌',
  bid_withdrawn: '↩️',
  task_assigned: '📋',
  task_completed: '🎉',
  task_cancelled: '⛔',
  review_received: '⭐',
  user_verified: '✔️',
  user_rejected: '❌',
  payment_received: '💳',
  system_alert: 'ℹ️',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notifications', {
        params: { filter, limit: 50 },
      });
      setNotifications(data.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Mark as read
  const handleMarkAsRead = async (notificationId, isRead) => {
    try {
      if (!isRead) {
        await axios.put(`/api/notifications/${notificationId}/read`);
      }
      
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: !n.isRead } : n
        )
      );
      toast.success(isRead ? 'Marked as unread' : 'Marked as read');
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Select notification
  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n._id)));
    }
  };

  // Delete selected
  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedNotifications).map(id =>
          axios.delete(`/api/notifications/${id}`)
        )
      );
      
      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.has(n._id))
      );
      setSelectedNotifications(new Set());
      toast.success('Selected notifications deleted');
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Notifications</h1>
        <p className={styles.subtitle}>
          {filter === 'all'
            ? `${notifications.length} notifications`
            : filter === 'unread'
            ? `${notifications.filter(n => !n.isRead).length} unread`
            : `${notifications.filter(n => n.isRead).length} read`}
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>

        {selectedNotifications.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectedCount}>
              {selectedNotifications.size} selected
            </span>
            <button
              className={styles.deleteBtn}
              onClick={handleDeleteSelected}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <p>No notifications</p>
        </div>
      ) : (
        <div className={styles.list}>
          {/* Select all checkbox */}
          {notifications.length > 1 && (
            <div className={styles.selectAllRow}>
              <input
                type="checkbox"
                checked={selectedNotifications.size === notifications.length}
                onChange={handleSelectAll}
              />
              <label onClick={handleSelectAll}>
                {selectedNotifications.size === notifications.length ? 'Deselect All' : 'Select All'}
              </label>
            </div>
          )}

          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedNotifications.has(notification._id)}
                onChange={() => handleSelectNotification(notification._id)}
              />

              <div className={styles.icon}>
                {notificationTypeIcons[notification.type] || 'ℹ️'}
              </div>

              <div className={styles.content}>
                <div className={styles.title}>{notification.title}</div>
                <div className={styles.message}>{notification.message}</div>
                <div className={styles.meta}>
                  <span className={styles.type}>{notification.type}</span>
                  <span className={styles.date}>
                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleMarkAsRead(notification._id, notification.isRead)}
                  title={notification.isRead ? 'Mark unread' : 'Mark as read'}
                >
                  {notification.isRead ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  className={styles.deleteActionBtn}
                  onClick={() => handleDelete(notification._id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
