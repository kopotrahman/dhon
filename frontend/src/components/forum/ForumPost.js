import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { forumAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import './Forum.css';

const ForumPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getPostById(postId);
      setPost(response.data);
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await forumAPI.toggleLike(postId);
      setPost(prev => ({
        ...prev,
        likes: prev.likes.some(l => l._id === user._id || l === user._id)
          ? prev.likes.filter(l => (l._id || l) !== user._id)
          : [...prev.likes, { _id: user._id, name: user.name }]
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await forumAPI.addComment(postId, newComment.trim());
      setPost(prev => ({ ...prev, comments: response.data.comments }));
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await forumAPI.deleteComment(postId, commentId);
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId)
      }));
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await forumAPI.deletePost(postId);
      navigate('/forum');
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLiked = post?.likes?.some(l => (l._id || l) === user?._id);
  const isAuthor = post?.author?._id === user?._id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error && !post) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/forum" className="btn-primary">Back to Forum</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-container">
        <p>Post not found</p>
        <Link to="/forum" className="btn-primary">Back to Forum</Link>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-navigation">
        <Link to="/forum" className="back-link">← Back to Forum</Link>
        {(isAuthor || isAdmin) && (
          <div className="post-actions-top">
            {isAuthor && (
              <Link to={`/forum/${postId}/edit`} className="btn-edit">Edit</Link>
            )}
            <button onClick={handleDeletePost} className="btn-delete">Delete</button>
          </div>
        )}
      </div>

      <article className="post-detail">
        <header className="post-header">
          <div className="post-author-info">
            {post.author?.profilePhoto ? (
              <img 
                src={post.author.profilePhoto} 
                alt={post.author.name}
                className="author-avatar-large"
              />
            ) : (
              <div className="author-avatar-large placeholder">
                {post.author?.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="author-details">
              <span className="author-name">{post.author?.name}</span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
          </div>
          {post.visibility === 'private' && (
            <span className="visibility-badge">🔒 Private</span>
          )}
        </header>

        <h1 className="post-title">{post.title}</h1>

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <Link key={index} to={`/forum?tag=${tag}`} className="post-tag">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="post-body">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {post.images && post.images.length > 0 && (
          <div className="post-images-gallery">
            {post.images.map((img, index) => (
              <img key={index} src={img} alt={`Post image ${index + 1}`} />
            ))}
          </div>
        )}

        <footer className="post-footer">
          <button 
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0} likes
          </button>
        </footer>
      </article>

      <section className="comments-section">
        <h2>Comments ({post.comments?.length || 0})</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleAddComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows="3"
            maxLength={1000}
          />
          <button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        <div className="comments-list">
          {post.comments?.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          ) : (
            post.comments?.map(comment => (
              <div key={comment._id} className="comment-card">
                <div className="comment-header">
                  <div className="comment-author">
                    {comment.author?.profilePhoto ? (
                      <img 
                        src={comment.author.profilePhoto} 
                        alt={comment.author.name}
                        className="comment-avatar"
                      />
                    ) : (
                      <div className="comment-avatar placeholder">
                        {comment.author?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <span className="comment-author-name">{comment.author?.name}</span>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                  {(comment.author?._id === user?._id || isAuthor || isAdmin) && (
                    <button 
                      className="delete-comment"
                      onClick={() => handleDeleteComment(comment._id)}
                      aria-label="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ForumPost;
