'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReviewsList({ userId, taskId, showDelete = false, onReviewDeleted }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        let endpoint;
        
        if (userId) {
          endpoint = `/reviews/user/${userId}?page=${page}&limit=5`;
        } else if (taskId) {
          endpoint = `/reviews/task/${taskId}`;
        } else {
          return;
        }

        const response = await api.get(endpoint);
        
        if (userId) {
          setReviews(response.data.data.reviews);
          setUserStats(response.data.data.userStats);
          setTotalPages(response.data.data.pagination.pages);
        } else {
          setReviews(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId, taskId, page]);

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter((r) => r._id !== reviewId));
      toast.success('Review deleted');
      
      if (onReviewDeleted) {
        onReviewDeleted(reviewId);
      }
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '24px' }}>Loading reviews...</div>;
  }

  return (
    <div>
      {/* User Stats Header */}
      {userStats && (
        <div className="card" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              src={userStats.profileImage || '/avatar.png'}
              alt={userStats.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{userStats.name}</h3>
              <p style={{ color: '#9CA3AF', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                {userStats.totalReviews} review{userStats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#fbbf24', display: 'flex' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={24}
                  fill={star <= Math.round(userStats.averageRating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, marginLeft: '8px' }}>
              {userStats.averageRating > 0 ? userStats.averageRating : 'No ratings yet'}
            </span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
          {userStats ? 'No reviews yet' : 'No reviews for this task'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((review) => (
            <div key={review._id} className="card">
              {/* Review Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  {!review.isAnonymous && review.reviewerId && (
                    <>
                      <img
                        src={review.reviewerId.profileImage || '/avatar.png'}
                        alt={review.reviewerId.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {review.reviewerId.name}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                  {review.isAnonymous && (
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Anonymous
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {showDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(review._id)}
                    className="btn btn-danger btn-sm"
                    title="Delete review"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              {/* Star Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.2rem', color: '#fbbf24', display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={18}
                      fill={star <= review.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {review.rating}.0
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p style={{ margin: '8px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {review.comment}
                </p>
              )}

              {/* Task Reference (if showing all reviews) */}
              {review.taskId && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                  Task: {review.taskId.title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {userStats && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 12px',
                border: page === p ? '2px solid #3b82f6' : '1px solid var(--border)',
                background: page === p ? '#3b82f6' : 'transparent',
                color: page === p ? 'white' : 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: page === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
