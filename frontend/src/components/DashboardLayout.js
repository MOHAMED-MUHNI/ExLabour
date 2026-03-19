'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  FiZap, FiHome, FiPlus, FiList, FiUser, FiLogOut,
  FiShield, FiUsers, FiCheckSquare, FiBarChart2, FiFileText, FiBriefcase,
} from 'react-icons/fi';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isTasker = user.role === 'tasker';

  const userLinks = [
    { href: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { href: '/dashboard/tasks/new', icon: <FiPlus />, label: 'Post a Task' },
    { href: '/dashboard/my-tasks', icon: <FiList />, label: 'My Tasks' },
    { href: '/dashboard/profile', icon: <FiUser />, label: 'Profile' },
  ];

  const taskerLinks = [
    { href: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { href: '/tasks', icon: <FiBriefcase />, label: 'Browse Tasks' },
    { href: '/dashboard/my-bids', icon: <FiFileText />, label: 'My Bids' },
    { href: '/dashboard/assigned-tasks', icon: <FiCheckSquare />, label: 'Assigned Tasks' },
    { href: '/dashboard/profile', icon: <FiUser />, label: 'Profile' },
  ];

  const adminLinks = [
    { href: '/admin', icon: <FiBarChart2 />, label: 'Dashboard' },
    { href: '/admin/users', icon: <FiUsers />, label: 'Users' },
    { href: '/admin/tasks', icon: <FiCheckSquare />, label: 'Tasks' },
    { href: '/admin/bids', icon: <FiFileText />, label: 'Bids' },
  ];

  const links = isAdmin ? adminLinks : isTasker ? taskerLinks : userLinks;

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          <FiZap /> <span>ExLabour</span>
        </Link>

        <div className="sidebar-section">
          {isAdmin ? 'Admin' : isTasker ? 'Tasker' : 'Main'}
        </div>

        <ul className="sidebar-nav">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? 'active' : ''}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-section" style={{ marginTop: '16px' }}>Account</div>
        <ul className="sidebar-nav">
          <li>
            <a onClick={logout} style={{ cursor: 'pointer' }}>
              <FiLogOut />
              Sign Out
            </a>
          </li>
        </ul>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={user.name}
                width={36}
                height={36}
                unoptimized
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="sidebar-user-info">
            <h4>{user.name}</h4>
            <span>{user.role}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
