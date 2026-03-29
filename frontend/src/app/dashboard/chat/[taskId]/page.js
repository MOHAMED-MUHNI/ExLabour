'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { FiArrowLeft, FiSend, FiMessageSquare } from 'react-icons/fi';
import Image from 'next/image';

export default function ChatPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [task, setTask] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${taskId}`);
      setMessages(res.data.messages);
    } catch (err) {
      // silently fail for polling
    }
  }, [taskId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [taskRes] = await Promise.all([
          api.get(`/tasks/${taskId}`),
          loadMessages(),
        ]);
        setTask(taskRes.data.task);
      } catch (err) {
        toast.error('Conversation not found');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
    // Poll every 5 seconds
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [taskId, router, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${taskId}`, { content });
      setMessages((prev) => [...prev, res.data.message]);
      setContent('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen"><div className="spinner" /></div>
      </DashboardLayout>
    );
  }

  const otherParty = user?._id === task?.userId?._id || user?._id === task?.userId
    ? task?.assignedTaskerId
    : task?.userId;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} className="btn btn-secondary btn-sm">
            <FiArrowLeft />
          </button>
          <FiMessageSquare style={{ color: 'var(--accent)', fontSize: '1.25rem' }} />
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{task?.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Chat with {otherParty?.name || 'the other party'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          className="card"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
              <FiMessageSquare style={{ fontSize: '2.5rem', marginBottom: '8px', opacity: 0.4 }} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
              return (
                <div
                  key={msg._id}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    gap: '10px',
                    alignItems: 'flex-end',
                  }}
                >
                  {!isMe && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {msg.senderId?.profileImage ? (
                        <Image src={msg.senderId.profileImage} alt={msg.senderId.name} width={32} height={32} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(msg.senderId?.name)
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '70%',
                      background: isMe ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <p style={{ margin: 0 }}>{msg.content}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', opacity: 0.7, textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Type a message…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ flex: 1 }}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !content.trim()}>
            {sending ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : <FiSend />}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
