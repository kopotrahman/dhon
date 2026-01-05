import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Marketplace.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters, pagination.current]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await api.get(`/marketplace/products?${params}`);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/marketplace/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1>Auto Parts Marketplace</h1>
        <p>Quality parts, tools, and accessories for your vehicle</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            value={filters.search}
            onChange={handleFilterChange}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        <div className="filter-controls">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="totalSold">Best Selling</option>
          </select>

          <select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="asc">Low to High</option>
            <option value="desc">High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <Link to={`/marketplace/product/${product.slug || product._id}`}>
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0].url} alt={product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    {product.compareAtPrice > product.price && (
                      <span className="sale-badge">Sale</span>
                    )}
                    {product.isFeatured && (
                      <span className="featured-badge">Featured</span>
                    )}
                  </div>
                </Link>
                
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <Link to={`/marketplace/product/${product.slug || product._id}`}>
                    <h3 className="product-name">{product.name}</h3>
                  </Link>
                  
                  <div className="product-price">
                    <span className="current-price">${product.price.toFixed(2)}</span>
                    {product.compareAtPrice > product.price && (
                      <span className="original-price">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {product.rating > 0 && (
                    <div className="product-rating">
                      {'★'.repeat(Math.round(product.rating))}
                      {'☆'.repeat(5 - Math.round(product.rating))}
                      <span>({product.reviewCount})</span>
                    </div>
                  )}

                  <div className="product-actions">
                    {product.stock > 0 ? (
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => addToCart(product._id)}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="no-products">
              No products found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current === 1}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              >
                Previous
              </button>
              
              <span>Page {pagination.current} of {pagination.pages}</span>
              
              <button
                disabled={pagination.current === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
