import React, { useState, useEffect } from 'react';
import { reviewAPI } from '../../utils/api';
import './Reviews.css';

const ReviewList = ({ targetType, targetId }) => {
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [targetType, targetId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getReviews({
        targetType,
        targetId,
        page,
        limit: 10
      });
      setReviews(response.data.reviews);
      setRatingDistribution(response.data.ratingDistribution);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && page === 1) {
    return <div className="loading">Loading reviews...</div>;
  }

  return (
    <div className="review-list-container">
      <div className="review-summary">
        <div className="average-rating">
          <span className="rating-value">{calculateAverageRating()}</span>
          <div className="rating-stars">{renderStars(Math.round(calculateAverageRating()))}</div>
          <span className="total-reviews">{pagination.total || 0} reviews</span>
        </div>
        
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingDistribution.find(r => r._id === star)?.count || 0;
            const percentage = pagination.total ? (count / pagination.total * 100) : 0;
            
            return (
              <div key={star} className="rating-bar" aria-label={`${star} stars: ${count} reviews`}>
                <span className="star-label">{star}★</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reviews">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map(review => (
            <article key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.reviewer?.profilePhoto ? (
                    <img 
                      src={review.reviewer.profilePhoto} 
                      alt={review.reviewer?.name}
                      className="reviewer-avatar"
                    />
                  ) : (
                    <div className="reviewer-avatar placeholder">
                      {review.reviewer?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="reviewer-details">
                    <span className="reviewer-name">
                      {review.reviewer?.name || 'Anonymous'}
                      {review.isVerified && (
                        <span className="verified-badge" title="Verified Reviewer">✓</span>
                      )}
                    </span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <div className="review-body">
                <p>{review.feedback}</p>
              </div>
            </article>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => p - 1)} 
            disabled={page === 1}
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={page === pagination.pages}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
