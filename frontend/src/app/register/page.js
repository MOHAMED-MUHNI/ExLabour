'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiZap, FiUser, FiMail, FiLock, FiPhone, FiArrowRight } from 'react-icons/fi';

import { Suspense } from 'react';

function RegisterContent() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'user';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: defaultRole,
    bio: '',
    skills: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        ...formData,
        skills: formData.role === 'tasker' ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
    } catch (error) {
      // Handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-3">
          <Link href="/" className="navbar-brand" style={{ justifyContent: 'center', marginBottom: '24px', display: 'inline-flex' }}>
            <FiZap /> <span>ExLabour</span>
          </Link>
          <h1>Create Account</h1>
          <p>Join ExLabour and start getting things done</p>
        </div>

        {/* Role tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${formData.role === 'user' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'user' })}
          >
            I need a tasker
          </button>
          <button
            type="button"
            className={`role-tab ${formData.role === 'tasker' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'tasker' })}
          >
            I am a tasker
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="register-name"
                type="text"
                name="name"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="register-email"
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-2 gap-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (optional)</label>
            <div style={{ position: 'relative' }}>
              <FiPhone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="register-phone"
                type="tel"
                name="phone"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location (optional)</label>
            <input
              id="register-location"
              type="text"
              name="location"
              className="form-input"
              placeholder="City, State"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {formData.role === 'tasker' && (
            <>
              <div className="form-group">
                <label className="form-label">Skills (comma-separated)</label>
                <input
                  id="register-skills"
                  type="text"
                  name="skills"
                  className="form-input"
                  placeholder="e.g. Web Development, UI Design, Plumbing"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  id="register-bio"
                  name="bio"
                  className="form-textarea"
                  placeholder="Tell us about yourself and your experience..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </>
          )}

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <>Create Account <FiArrowRight /></>}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
