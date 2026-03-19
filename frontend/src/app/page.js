'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { FiZap, FiShield, FiUsers, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <FiZap /> <span>ExLabour</span>
        </Link>
        <ul className="navbar-links">
          {user ? (
            <li>
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <button className="btn btn-primary btn-sm">Dashboard</button>
              </Link>
            </li>
          ) : (
            <>
              <li><Link href="/login">Sign In</Link></li>
              <li>
                <Link href="/register">
                  <button className="btn btn-primary btn-sm">Get Started</button>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container flex justify-between items-center" style={{ gap: '60px', textAlign: 'left', minHeight: '80vh' }}>
          <div className="hero-content" style={{ flex: 1, maxWidth: '600px' }}>
            <h1 style={{ fontSize: '3.8rem' }}>
              Everything You Need <br />
              With <span className="gradient-text">ExLabour</span>
            </h1>
            <p>
              The marketplace that connects you with verified professionals.
              Post a task, receive competitive bids, and choose the perfect tasker for the job.
            </p>
            <div className="hero-buttons" style={{ justifyContent: 'flex-start' }}>
              <Link href="/register">
                <button className="btn btn-primary btn-lg">
                  Post a Task <FiArrowRight />
                </button>
              </Link>
              <Link href="/register?role=tasker">
                <button className="btn btn-secondary btn-lg">
                  Become a Tasker
                </button>
              </Link>
            </div>
          </div>

          <div className="hero-image" style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              aspectRatio: '1',
              background: 'radial-gradient(circle, rgba(108, 99, 255, 0.15) 0%, transparent 75%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image
                src="/hero.png"
                alt="ExLabour Freelance Illustration"
                className="animate-float-3d"
                width={600}
                height={600}
                priority
                style={{
                  width: '120%',
                  height: 'auto',
                  filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
            {/* Glass decoration */}
            <div style={{
              position: 'absolute',
              bottom: '10%',
              right: '-5%',
              width: '180px',
              padding: '16px',
              background: 'rgba(26, 31, 53, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 2
            }}>
              <div className="flex items-center gap-1 mb-1">
                <FiCheckCircle style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Task Completed</span>
              </div>
              <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'var(--success)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>How ExLabour Works</h2>
        <div className="features-grid container">
          <div className="feature-card">
            <div className="feature-icon stat-icon purple">
              <FiUsers />
            </div>
            <h3>Post Your Task</h3>
            <p>Describe what you need, set a budget, and let verified taskers come to you with competitive proposals.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon stat-icon green">
              <FiCheckCircle />
            </div>
            <h3>Compare Bids</h3>
            <p>Review proposals from skilled taskers. Compare prices, delivery times, and messages to find the best match.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon stat-icon blue">
              <FiShield />
            </div>
            <h3>Get It Done</h3>
            <p>Accept the best bid, track progress, and get your task completed by a verified professional. It&apos;s that simple.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>&copy; {new Date().getFullYear()} ExLabour. Built as an internship project.</p>
      </footer>
    </>
  );
}
