'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const savedUser = localStorage.getItem('exlabour_user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('exlabour_user');
    return null;
  }
};

const hasStoredAuth = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('exlabour_token') && localStorage.getItem('exlabour_user'));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(hasStoredAuth);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    if (!hasStoredAuth()) return;

    // Verify token is still valid
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('exlabour_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('exlabour_token');
        localStorage.removeItem('exlabour_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      
      // After registration, user needs to verify email before login
      if (res.data.requiresEmailVerification) {
        // Store email for verification pending page
        localStorage.setItem('registration_email', res.data.email);
        toast.success('Registration successful! Please check your email to verify your account.');
        router.push(`/verify-email-pending?email=${encodeURIComponent(res.data.email)}`);
        return res.data;
      }
      
      // Fallback for legacy flow (if ever no email verification required)
      const { accessToken, user: newUser } = res.data;
      localStorage.setItem('exlabour_token', accessToken);
      localStorage.setItem('exlabour_user', JSON.stringify(newUser));
      setUser(newUser);
      toast.success('Registration successful!');
      router.push('/dashboard');
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedInUser } = res.data;
      localStorage.setItem('exlabour_token', accessToken);
      localStorage.setItem('exlabour_user', JSON.stringify(loggedInUser));
      // Note: refreshToken is stored in HTTP-only cookie by server
      setUser(loggedInUser);
      toast.success('Welcome back!');

      // Route based on role
      if (loggedInUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      return res.data;
    } catch (error) {
      // Check if error is due to unverified email
      if (error.response?.data?.requiresEmailVerification) {
        toast.error('Please verify your email before logging in');
        router.push(`/verify-email-pending?email=${email}`);
        throw error;
      }
      
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear refresh token on server
      await api.post('/auth/logout').catch(() => {}); // Ignore errors
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('exlabour_token');
      localStorage.removeItem('exlabour_user');
      setUser(null);
      toast.success('Logged out');
      router.push('/login');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('exlabour_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
