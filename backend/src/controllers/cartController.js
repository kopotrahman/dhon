const Cart = require('../models/Cart');
const Product = require('../models/Product');

// =====================================================
// CART MANAGEMENT
// =====================================================

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user._id);
    await cart.populate('items.product');

    // Filter out unavailable products
    const validItems = cart.items.filter(item => 
      item.product && item.product.isActive && item.product.isApproved
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive || !product.isApproved) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    if (product.trackInventory && product.stock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: product.stock
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && !item.savedForLater
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock for total quantity
      if (product.trackInventory && product.stock < newQuantity) {
        return res.status(400).json({ 
          message: 'Cannot add more items. Insufficient stock.',
          available: product.stock,
          inCart: cart.items[existingItemIndex].quantity
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceAtAdd: product.price,
        savedForLater: false
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Validate stock if increasing quantity
    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (product && product.trackInventory && product.stock < quantity) {
        return res.status(400).json({ 
          message: 'Insufficient stock',
          available: product.stock
        });
      }
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );
    } else {
      const item = cart.items.find(
        item => item.product.toString() === productId
      );
      if (item) {
        item.quantity = quantity;
      }
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.clearCart();

    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save item for later
exports.saveForLater = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.savedForLater = true;
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item saved for later',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Move saved item back to cart
exports.moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId && item.savedForLater
    );

    if (!item) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product && product.trackInventory && product.stock < item.quantity) {
      item.quantity = product.stock || 1;
    }

    // Update price if changed
    if (product) {
      item.priceAtAdd = product.price;
    }

    item.savedForLater = false;
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item moved to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply coupon code
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // TODO: Implement coupon validation logic
    // For now, simple demo discount
    const validCoupons = {
      'SAVE10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FLAT50': { type: 'fixed', value: 50 }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    await cart.populate('items.product');
    const subtotal = cart.subtotal;

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    cart.couponCode = couponCode.toUpperCase();
    cart.couponDiscount = Math.min(discount, subtotal);
    await cart.save();

    res.json({
      message: 'Coupon applied',
      coupon: couponCode,
      discount: cart.couponDiscount,
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove coupon
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Coupon removed',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get cart summary
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      return res.json({
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        total: 0
      });
    }

    res.json({
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      discount: cart.couponDiscount,
      total: cart.total,
      coupon: cart.couponCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate cart before checkout
exports.validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.activeItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const issues = [];
    const validItems = [];

    for (const item of cart.activeItems) {
      if (!item.product) {
        issues.push({ productId: item.product, issue: 'Product no longer exists' });
        continue;
      }

      if (!item.product.isActive || !item.product.isApproved) {
        issues.push({ 
          productId: item.product._id, 
          name: item.product.name,
          issue: 'Product is no longer available' 
        });
        continue;
      }

      if (item.product.trackInventory && item.product.stock < item.quantity) {
        issues.push({ 
          productId: item.product._id,
          name: item.product.name,
          issue: 'Insufficient stock',
          available: item.product.stock,
          requested: item.quantity
        });
        continue;
      }

      if (item.product.price !== item.priceAtAdd) {
        issues.push({
          productId: item.product._id,
          name: item.product.name,
          issue: 'Price has changed',
          oldPrice: item.priceAtAdd,
          newPrice: item.product.price
        });
        // Update price
        item.priceAtAdd = item.product.price;
      }

      validItems.push(item);
    }

    if (issues.length > 0) {
      await cart.save();
    }

    res.json({
      valid: issues.length === 0,
      issues,
      itemCount: validItems.length,
      total: cart.total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
