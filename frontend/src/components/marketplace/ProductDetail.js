import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Marketplace.css';

const ProductDetail = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProduct();
  }, [slugOrId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // Try slug first, then ID
      let response;
      try {
        response = await api.get(`/marketplace/products/slug/${slugOrId}`);
      } catch {
        response = await api.get(`/marketplace/products/id/${slugOrId}`);
      }
      
      setProduct(response.data.product);
      setRelatedProducts(response.data.relatedProducts || []);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await api.post('/cart/items', { productId: product._id, quantity });
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back to Marketplace
      </button>

      <div className="product-detail">
        {/* Image Gallery */}
        <div className="product-gallery">
          <div className="main-image">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[selectedImage]?.url} 
                alt={product.name} 
              />
            ) : (
              <div className="no-image">No Image</div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img.url} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info-detail">
          <span className="product-category">{product.category}</span>
          <h1 className="product-title">{product.name}</h1>
          
          {product.brand && (
            <p className="product-brand">Brand: {product.brand}</p>
          )}
          
          {product.sku && (
            <p className="product-sku">SKU: {product.sku}</p>
          )}

          {product.rating > 0 && (
            <div className="product-rating">
              {'★'.repeat(Math.round(product.rating))}
              {'☆'.repeat(5 - Math.round(product.rating))}
              <span>({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="product-price-detail">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.compareAtPrice > product.price && (
              <>
                <span className="original-price">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
                <span className="discount-badge">
                  {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <div className="stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">
                ✓ In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="out-of-stock">✗ Out of Stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={product.stock}
                />
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              
              <button className="add-to-cart-btn large" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          )}

          {/* Vendor Info */}
          {product.vendor && (
            <div className="vendor-info">
              <p>Sold by: <strong>{product.vendor.businessName}</strong></p>
            </div>
          )}

          {/* Warranty */}
          {product.warranty && product.warranty.hasWarranty && (
            <div className="warranty-info">
              <p>✓ {product.warranty.duration} {product.warranty.durationType} warranty</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="product-tabs">
        <div className="tab-headers">
          <button
            className={activeTab === 'description' ? 'active' : ''}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={activeTab === 'specifications' ? 'active' : ''}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button
            className={activeTab === 'compatibility' ? 'active' : ''}
            onClick={() => setActiveTab('compatibility')}
          >
            Compatibility
          </button>
          <button
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({product.reviewCount || 0})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="description-tab">
              <p>{product.description}</p>
              
              {product.features && product.features.length > 0 && (
                <div className="features-list">
                  <h3>Features</h3>
                  <ul>
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="specifications-tab">
              {product.specifications && product.specifications.length > 0 ? (
                <table className="specs-table">
                  <tbody>
                    {product.specifications.map((spec, index) => (
                      <tr key={index}>
                        <td>{spec.name}</td>
                        <td>{spec.value} {spec.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No specifications available</p>
              )}

              {product.weight && (
                <p>Weight: {product.weight.value} {product.weight.unit}</p>
              )}

              {product.dimensions && (
                <p>
                  Dimensions: {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}
                </p>
              )}
            </div>
          )}

          {activeTab === 'compatibility' && (
            <div className="compatibility-tab">
              {product.compatibleCars && product.compatibleCars.length > 0 ? (
                <ul className="compatibility-list">
                  {product.compatibleCars.map((car, index) => (
                    <li key={index}>
                      {car.make} {car.model} ({car.yearStart} - {car.yearEnd || 'Present'})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Compatibility information not available. This product may be universal or contact seller for details.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <p>Reviews coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Related Products</h2>
          <div className="related-grid">
            {relatedProducts.map(relProduct => (
              <div key={relProduct._id} className="product-card small">
                <a href={`/marketplace/product/${relProduct.slug || relProduct._id}`}>
                  <div className="product-image">
                    {relProduct.images && relProduct.images.length > 0 ? (
                      <img src={relProduct.images[0].url} alt={relProduct.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <h4>{relProduct.name}</h4>
                  <p className="price">${relProduct.price.toFixed(2)}</p>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
