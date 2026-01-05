const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  getProductBySlug,
  getCategories,
  getFeaturedProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  updateStock,
  getPendingProducts,
  approveProduct,
  setFeatured,
  getAllProducts
} = require('../controllers/marketplaceController');
const upload = require('../middleware/upload');

// Public routes
router.get('/products', getProducts);
router.get('/products/search', searchProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/products/id/:id', getProductById);
router.get('/products/slug/:slug', getProductBySlug);

// Vendor routes (authenticated)
router.post('/products', authenticate, upload.array('images', 10), createProduct);
router.get('/my-products', authenticate, getMyProducts);
router.put('/products/:id', authenticate, upload.array('images', 10), updateProduct);
router.delete('/products/:id', authenticate, deleteProduct);
router.patch('/products/:id/stock', authenticate, updateStock);

// Admin routes
router.get('/admin/products', authenticate, authorize('admin'), getAllProducts);
router.get('/admin/products/pending', authenticate, authorize('admin'), getPendingProducts);
router.patch('/admin/products/:id/approve', authenticate, authorize('admin'), approveProduct);
router.patch('/admin/products/:id/featured', authenticate, authorize('admin'), setFeatured);

module.exports = router;
