import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'react-feather';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread/count');
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', {
        params: { page: pageNum, limit: 5 },
      });
      
      if (pageNum === 1) {
        setNotifications(data.data);
      } else {
        setNotifications(prev => [...prev, ...data.data]);
      }
      
      setHasMore(pageNum < data.pages);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to load notifications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open panel and fetch notifications
  const handleOpenPanel = () => {
    setIsOpen(true);
    fetchNotifications(1);
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read/all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    fetchNotifications(page + 1);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.container}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  return (
    <div className={styles.container}>
      <button
        className={styles.bellButton}
        onClick={handleOpenPanel}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {unreadCount > 0 && (
            <div className={styles.toolbar}>
              <button
                className={styles.markAllBtn}
                onClick={handleMarkAllAsRead}
              >
                <Check size={14} /> Mark all as read
              </button>
            </div>
          )}

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li
                    key={notification._id}
                    className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
                  >
                    <div className={styles.content}>
                      <div className={styles.title}>{notification.title}</div>
                      <div className={styles.message}>{notification.message}</div>
                      <div className={styles.time}>
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      {!notification.isRead && (
                        <button
                          className={styles.actionBtn}
                          onClick={e => handleMarkAsRead(notification._id, e)}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={e => handleDelete(notification._id, e)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasMore && (
            <button
              className={styles.loadMoreBtn}
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
