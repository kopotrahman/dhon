import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forumAPI } from '../../utils/api';
import './Forum.css';

const ForumCreatePost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    visibility: 'public'
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('content', formData.content.trim());
      data.append('visibility', formData.visibility);
      
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        tagsArray.forEach(tag => data.append('tags[]', tag));
      }

      images.forEach(img => data.append('images', img));

      await forumAPI.createPost(data);
      navigate('/forum');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const suggestedTags = ['repair', 'experience', 'suggestion', 'question', 'review', 'tips', 'help'];

  return (
    <div className="create-post-container">
      <div className="page-header">
        <h1>Create New Post</h1>
        <p>Share your thoughts with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a descriptive title..."
            maxLength={200}
            required
          />
          <span className="char-count">{formData.title.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Share your experience, ask a question, or start a discussion..."
            rows="8"
            maxLength={5000}
            required
          />
          <span className="char-count">{formData.content.length}/5000</span>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Enter tags separated by commas..."
          />
          <div className="suggested-tags">
            <span className="suggested-label">Suggested:</span>
            {suggestedTags.map(tag => (
              <button
                key={tag}
                type="button"
                className="suggested-tag"
                onClick={() => {
                  const current = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                  if (!current.includes(tag)) {
                    setFormData(prev => ({
                      ...prev,
                      tags: current.length > 0 ? `${prev.tags}, ${tag}` : tag
                    }));
                  }
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
          >
            <option value="public">🌐 Public - Everyone can see</option>
            <option value="private">🔒 Private - Only you can see</option>
          </select>
        </div>

        <div className="form-group">
          <label>Images (Optional)</label>
          <div className="image-upload-area">
            <input
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="images" className="upload-label">
              📷 Click to add images (max 5)
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="image-previews">
              {images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={URL.createObjectURL(img)} alt={`Preview ${index + 1}`} />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={() => removeImage(index)}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => navigate('/forum')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForumCreatePost;
