import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import './Forum.css';

const ForumList = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tag: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchPopularTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getPosts({
        ...filters,
        page,
        limit: 15
      });
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await forumAPI.getPopularTags();
      setPopularTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      await forumAPI.toggleLike(postId);
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, likes: post.likes.includes(user._id) 
              ? post.likes.filter(id => id !== user._id)
              : [...post.likes, user._id] }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleTagClick = (tag) => {
    setFilters(prev => ({ ...prev, tag: prev.tag === tag ? '' : tag }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now - postDate;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <div className="forum-container">
      <div className="forum-header">
        <div className="header-content">
          <h1>💬 Community Forum</h1>
          <p>Share experiences, ask questions, and connect with other users</p>
        </div>
        <Link to="/forum/create" className="btn-create-post">
          ✏️ Create Post
        </Link>
      </div>

      <div className="forum-layout">
        <aside className="forum-sidebar">
          <div className="search-box">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search posts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                aria-label="Search posts"
              />
              <button type="submit" aria-label="Search">🔍</button>
            </form>
          </div>

          <div className="tags-section">
            <h3>Popular Tags</h3>
            <div className="tags-list">
              {popularTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  className={`tag-btn ${filters.tag === tag ? 'active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  #{tag} <span className="tag-count">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="forum-main">
          {loading && page === 1 ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts found. Be the first to start a discussion!</p>
              <Link to="/forum/create" className="btn-primary">Create Post</Link>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map(post => (
                <article key={post._id} className="post-card">
                  <div className="post-author">
                    {post.author?.profilePhoto ? (
                      <img 
                        src={post.author.profilePhoto} 
                        alt={post.author?.name}
                        className="author-avatar"
                      />
                    ) : (
                      <div className="author-avatar placeholder">
                        {post.author?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="author-info">
                      <span className="author-name">{post.author?.name}</span>
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                    </div>
                    {post.visibility === 'private' && (
                      <span className="visibility-badge">🔒 Private</span>
                    )}
                  </div>

                  <Link to={`/forum/${post._id}`} className="post-content">
                    <h2>{post.title}</h2>
                    <p>{post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}</p>
                  </Link>

                  {post.images && post.images.length > 0 && (
                    <div className="post-images">
                      <img 
                        src={post.images[0]} 
                        alt="Post attachment"
                        className="post-image-preview"
                      />
                      {post.images.length > 1 && (
                        <span className="more-images">+{post.images.length - 1}</span>
                      )}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="post-tag"
                          onClick={() => handleTagClick(tag)}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="post-actions">
                    <button 
                      className={`action-btn ${post.likes?.includes(user?._id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post._id)}
                      aria-label={`Like post (${post.likes?.length || 0} likes)`}
                    >
                      {post.likes?.includes(user?._id) ? '❤️' : '🤍'} {post.likes?.length || 0}
                    </button>
                    <Link to={`/forum/${post._id}`} className="action-btn">
                      💬 {post.comments?.length || 0}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span>Page {page} of {pagination.pages}</span>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ForumList;
