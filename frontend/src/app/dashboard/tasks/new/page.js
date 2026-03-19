'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPaperclip, FiSend, FiUpload, FiX } from 'react-icons/fi';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'it-support', label: 'IT Support' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing' },
  { value: 'moving', label: 'Moving' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'photography', label: 'Photography' },
  { value: 'other', label: 'Other' },
];

export default function NewTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', budgetMin: '', budgetMax: '', deadline: '', location: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > 5) {
      toast.error('You can upload up to 5 attachments');
      e.target.value = '';
      return;
    }

    setUploadingAttachments(true);
    const uploaded = [];

    try {
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);

        const res = await api.post('/upload/task-attachment', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploaded.push(res.data.data);
      }

      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} attachment${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload attachment(s)');
    } finally {
      setUploadingAttachments(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.budgetMax) < Number(formData.budgetMin)) {
      toast.error('Max budget must be ≥ min budget');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/tasks', {
        ...formData,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        attachments,
      });
      toast.success('Task created! Pending admin approval.');
      router.push('/dashboard/my-tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px' }}>
      <Link href="/dashboard" className="page-back"><FiArrowLeft /> Back to Dashboard</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Post a New Task</h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Task Title</label>
          <input id="task-title" name="title" className="form-input" placeholder="e.g. Fix my kitchen sink" value={formData.title} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea id="task-description" name="description" className="form-textarea" placeholder="Describe what you need help with..." value={formData.description} onChange={handleChange} required rows={4} />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select id="task-category" name="category" className="form-select" value={formData.category} onChange={handleChange} required>
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid grid-2 gap-2">
          <div className="form-group">
            <label className="form-label">Min Budget (₹)</label>
            <input id="task-budget-min" name="budgetMin" type="number" className="form-input" placeholder="500" value={formData.budgetMin} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Max Budget (₹)</label>
            <input id="task-budget-max" name="budgetMax" type="number" className="form-input" placeholder="5000" value={formData.budgetMax} onChange={handleChange} required min="0" />
          </div>
        </div>

        <div className="grid grid-2 gap-2">
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input id="task-deadline" name="deadline" type="date" className="form-input" value={formData.deadline} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Location (optional)</label>
            <input id="task-location" name="location" className="form-input" placeholder="City, Area" value={formData.location} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Attachments (optional)</label>
          <label className="btn btn-secondary btn-sm" style={{ cursor: uploadingAttachments ? 'not-allowed' : 'pointer' }}>
            <FiUpload /> {uploadingAttachments ? 'Uploading...' : 'Upload Attachments'}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleAttachmentUpload}
              disabled={uploadingAttachments || isLoading}
              style={{ display: 'none' }}
            />
          </label>
          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '8px' }}>
            Up to 5 files. Supported: JPEG, PNG, WebP, PDF (max 5MB each).
          </p>

          {attachments.length > 0 && (
            <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attachments.map((file, index) => (
                <div
                  key={file.key || `${file.url}-${index}`}
                  className="flex justify-between items-center"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <FiPaperclip />
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.86rem' }}>{file.originalName || `Attachment ${index + 1}`}</span>
                  </a>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveAttachment(index)}>
                    <FiX /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button id="task-submit" type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={isLoading}>
          {isLoading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiSend /> Post Task</>}
        </button>
      </form>
    </div>
  );
}
