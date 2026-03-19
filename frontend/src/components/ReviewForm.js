'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiStar, FiSend } from 'react-icons/fi';

export default function ReviewForm({ taskId, targetUserName, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/reviews/task/${taskId}`, {
        rating,
        comment: comment.trim() || undefined,
        isAnonymous,
      });

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      setIsAnonymous(false);

      if (onReviewSubmitted) {
        onReviewSubmitted(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
        Rate your experience with {targetUserName}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div style={{ display: 'flex', gap: '12px', fontSize: '2rem', cursor: 'pointer' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: star <= (hoverRating || rating) ? '#fbbf24' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                title={`${star} star${star > 1 ? 's' : ''}`}
              >
                <FiStar size={32} fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: '8px' }}>
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="form-group">
          <label className="form-label">Comment (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Share your experience... (max 500 characters)"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={4}
            style={{ resize: 'vertical' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>
            {comment.length}/500
          </p>
        </div>

        {/* Anonymous Option */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#3b82f6',
              }}
            />
            <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Post as anonymous
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoading || rating === 0}
          style={{ opacity: rating === 0 ? 0.5 : 1 }}
        >
          {isLoading ? (
            <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
          ) : (
            <>
              <FiSend /> Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
