'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css';
import api from '@/lib/api';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email for the verification link.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setEmail(response.data.email);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Failed to verify email');
          setShowResend(true);
        }
      } catch (error) {
        setStatus('error');
        
        // Check if it's a token expiration error
        if (error.response?.data?.message?.includes('expired')) {
          setMessage('Verification token has expired. Please request a new one.');
          setShowResend(true);
        } else {
          setMessage(error.response?.data?.message || 'An error occurred during verification');
        }
        
        console.error('Email verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    const emailToResend = email || searchParams.get('email');
    
    if (!emailToResend) {
      setMessage('Email address is required to resend verification');
      return;
    }

    setResending(true);
    try {
      const response = await api.post('/auth/resend-verification-email', { 
        email: emailToResend 
      });

      if (response.data.success) {
        setMessage('Verification email sent! Check your inbox for the new verification link.');
        setShowResend(false);
      } else {
        setMessage(response.data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email');
      console.error('Resend verification error:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>Email Verification</h1>

        {loading && (
          <div className={styles.message}>
            <p>Verifying your email...</p>
            <div className={styles.spinner}></div>
          </div>
        )}

        {!loading && status === 'success' && (
          <div className={`${styles.message} ${styles.success}`}>
            <div className={styles.successIcon}>✓</div>
            <p>{message}</p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
              Redirecting to login page...
            </p>
          </div>
        )}

        {!loading && status === 'error' && (
          <div className={`${styles.message} ${styles.error}`}>
            <div className={styles.errorIcon}>✕</div>
            <p>{message}</p>
            
            {showResend && (
              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className={styles.button}
                  style={{ marginTop: '10px' }}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
              <p>
                Already verified?{' '}
                <Link href="/login" className={styles.link}>
                  Go to login
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .message {
          text-align: center;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .successIcon,
        .errorIcon {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .button {
          background-color: #3498db;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        }

        .button:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .button:disabled {
          background-color: #999;
          cursor: not-allowed;
        }

        .link {
          color: #0066cc;
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
