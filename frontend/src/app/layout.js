import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'ExLabour — Freelance Task Marketplace',
  description: 'Post tasks, get bids from verified taskers, and hire the best fit. ExLabour connects you with trusted service providers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1F35',
                color: '#F1F5F9',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: '10px',
                fontSize: '0.88rem',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
