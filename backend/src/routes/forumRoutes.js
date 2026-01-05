const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getPopularTags,
  moderatePost
} = require('../controllers/forumController');

// Public routes
router.get('/tags/popular', getPopularTags);

// Authenticated routes
router.get('/', authenticate, getPosts);
router.get('/:id', authenticate, getPostById);
router.post('/', authenticate, upload.array('images', 5), createPost);
router.put('/:id', authenticate, upload.array('images', 5), updatePost);
router.delete('/:id', authenticate, deletePost);

// Likes and comments
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comments', authenticate, addComment);
router.delete('/:id/comments/:commentId', authenticate, deleteComment);

// Admin routes
router.put('/:id/moderate', authenticate, authorize('admin'), moderatePost);

module.exports = router;
