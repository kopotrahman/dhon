const ForumPost = require('../models/ForumPost');
const { sendNotification } = require('../utils/notificationService');

// Create forum post
const createPost = async (req, res) => {
  try {
    const { title, content, tags, visibility } = req.body;

    const postData = {
      author: req.user._id,
      title,
      content,
      tags: tags || [],
      visibility: visibility || 'public'
    };

    if (req.files && req.files.length > 0) {
      postData.images = req.files.map(file => file.path);
    }

    const post = new ForumPost(postData);
    await post.save();

    await post.populate('author', 'name profilePhoto');

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all posts
const getPosts = async (req, res) => {
  try {
    const { tag, search, visibility, author, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Show only public posts or own private posts
    if (visibility === 'private') {
      filter.author = req.user._id;
      filter.visibility = 'private';
    } else {
      filter.$or = [
        { visibility: 'public' },
        { author: req.user._id }
      ];
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') }
      ];
    }

    if (author) {
      filter.author = author;
    }

    // Only show non-moderated posts (unless admin)
    if (req.user.role !== 'admin') {
      filter.isModerated = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await ForumPost.find(filter)
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ForumPost.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get post by ID
const getPostById = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name profilePhoto')
      .populate('comments.author', 'name profilePhoto')
      .populate('likes', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.visibility === 'private' && post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { title, content, tags, visibility } = req.body;

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;
    post.visibility = visibility || post.visibility;

    if (req.files && req.files.length > 0) {
      post.images = [...post.images, ...req.files.map(file => file.path)];
    }

    await post.save();
    await post.populate('author', 'name profilePhoto');

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ForumPost.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like/Unlike post
const toggleLike = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);

      // Notify post author
      if (post.author.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: post.author,
          type: 'message',
          title: 'New Like',
          message: `${req.user.name} liked your post "${post.title}"`
        });
      }
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      content,
      createdAt: new Date()
    });

    await post.save();
    await post.populate('comments.author', 'name profilePhoto');

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await sendNotification({
        recipient: post.author,
        type: 'message',
        title: 'New Comment',
        message: `${req.user.name} commented on your post "${post.title}"`
      });
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comments: post.comments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.json({ message: 'Comment deleted successfully', comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get popular tags
const getPopularTags = async (req, res) => {
  try {
    const tags = await ForumPost.aggregate([
      { $match: { visibility: 'public', isModerated: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json(tags.map(t => ({ tag: t._id, count: t.count })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Moderate post (Admin only)
const moderatePost = async (req, res) => {
  try {
    const { isModerated, reason } = req.body;

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isModerated = isModerated;
    post.moderatedBy = req.user._id;
    await post.save();

    // Notify author
    if (isModerated) {
      await sendNotification({
        recipient: post.author,
        type: 'system',
        title: 'Post Moderated',
        message: `Your post "${post.title}" has been moderated. ${reason || ''}`
      });
    }

    res.json({ message: 'Post moderated successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
