import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reviewAPI } from '../../utils/api';
import './Reviews.css';

const ReviewForm = ({ targetType, targetId, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (feedback.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await reviewAPI.createReview({
        targetType,
        targetId,
        rating,
        feedback: feedback.trim()
      });

      setSuccess(true);
      setRating(0);
      setFeedback('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="review-form-container">
        <p className="login-prompt">Please log in to write a review.</p>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3>Write a Review</h3>
      
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">Review submitted successfully!</div>}

      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label id="rating-label">Your Rating</label>
          <div 
            className="star-rating-input" 
            role="radiogroup" 
            aria-labelledby="rating-label"
          >
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onFocus={() => setHoveredRating(star)}
                onBlur={() => setHoveredRating(0)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                aria-pressed={rating === star}
              >
                ★
              </button>
            ))}
            <span className="rating-text">
              {rating > 0 && ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="feedback">Your Feedback</label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience..."
            rows="4"
            minLength={10}
            maxLength={1000}
            aria-describedby="feedback-hint"
          />
          <span id="feedback-hint" className="char-count">
            {feedback.length}/1000 characters
          </span>
        </div>

        <button 
          type="submit" 
          className="btn-submit-review"
          disabled={loading || rating === 0}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
