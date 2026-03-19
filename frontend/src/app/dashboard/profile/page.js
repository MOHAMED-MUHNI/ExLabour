'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiFileText, FiSave, FiUpload } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    location: user?.location || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = {
        ...formData,
        skills: user?.role === 'tasker' ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };
      const res = await api.put('/auth/profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setUploading(true);
    try {
      const res = await api.post('/upload/profile-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, profileImage: res.data.data.url });
      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Upload failed. Check your S3 configuration.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    setDocUploading(true);
    try {
      const res = await api.post('/upload/verification-document', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Verification document uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload verification document');
    } finally {
      setDocUploading(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="profile-page">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>My Profile</h1>

      {/* Avatar section */}
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          {user?.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.name}
              width={80}
              height={80}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        <div>
          <h3>{user?.name}</h3>
          <span className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px', textTransform: 'capitalize' }}>
            {user?.role} • <span className={`badge badge-${user?.verificationStatus}`}>{user?.verificationStatus}</span>
          </span>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Change Photo'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input name="name" className="form-input" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          <input name="phone" className="form-input" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input name="location" className="form-input" placeholder="City, State" value={formData.location} onChange={handleChange} />
        </div>

        {user?.role === 'tasker' && (
          <>
            <div className="form-group">
              <label className="form-label">Skills (comma-separated)</label>
              <input name="skills" className="form-input" placeholder="Web Dev, UI Design" value={formData.skills} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea name="bio" className="form-textarea" placeholder="Tell us about yourself..." value={formData.bio} onChange={handleChange} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Verification Documents</label>
              <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <FiUpload /> {docUploading ? 'Uploading...' : 'Upload Document'}
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={handleVerificationDocUpload}
                    style={{ display: 'none' }}
                    disabled={docUploading}
                  />
                </label>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  PDF/JPG/PNG/WebP, max 5MB each, up to 5 files.
                </span>
              </div>

              {user?.verificationStatus === 'rejected' && (
                <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--warning)' }}>
                  Your account was rejected. Upload updated documents to resubmit for admin review.
                </p>
              )}

              {Array.isArray(user?.verificationDocuments) && user.verificationDocuments.length > 0 ? (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {user.verificationDocuments.map((doc, index) => (
                    <a
                      key={doc.key || `${doc.url}-${index}`}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <FiFileText /> {doc.originalName || `Verification Document ${index + 1}`}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                  No verification documents uploaded yet.
                </p>
              )}
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiSave /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
