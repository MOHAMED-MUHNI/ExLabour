'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function VerifyEmailPending() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Get email from search params or localStorage
    const urlEmail = searchParams.get('email');
    const storedEmail = localStorage.getItem('registration_email');
    
    if (urlEmail) {
      setEmail(urlEmail);
      localStorage.setItem('registration_email', urlEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email address not found. Please register again.');
      return;
    }

    setResending(true);
    try {
      const response = await api.post('/auth/resend-verification-email', { email });
      
      if (response.data.success) {
        toast.success('Verification email sent! Check your inbox.');
      } else {
        toast.error(response.data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('registration_email');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>Verify Your Email</h1>
        
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '4px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginTop: 0, color: '#1565c0' }}>Check Your Email</h2>
          
          <p style={{ lineHeight: '1.6' }}>
            We've sent a verification email to:
          </p>
          
          <p style={{
            background: 'white',
            padding: '10px 15px',
            borderRadius: '4px',
            fontWeight: 'bold',
            color: '#1565c0',
            textAlign: 'center',
            marginBottom: '15px',
            wordBreak: 'break-all',
          }}>
            {email || 'your email address'}
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            <strong>Next steps:</strong>
          </p>
          
          <ol style={{ lineHeight: '1.8', marginLeft: '20px', marginBottom: '10px' }}>
            <li>Check your inbox for our verification email</li>
            <li>Click the verification link in the email</li>
            <li>You'll be able to login to ExLabour</li>
          </ol>
          
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 0 }}>
            ⏱️ The verification link expires in 24 hours
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className={styles.button}
            style={{
              background: resending ? '#ccc' : '#3498db',
              cursor: resending ? 'not-allowed' : 'pointer',
            }}
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <div style={{
          borderTop: '1px solid #e0e0e0',
          paddingTop: '15px',
          fontSize: '0.9rem',
          textAlign: 'center',
        }}>
          <p>
            Already verified your email?{' '}
            <button
              onClick={handleBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit',
              }}
            >
              Go to login
            </button>
          </p>
          
          <p style={{ opacity: 0.7 }}>
            Wrong email?{' '}
            <Link href="/register" className={styles.link}>
              Register again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
