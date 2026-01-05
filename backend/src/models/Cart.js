const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    priceAtAdd: {
      type: Number,
      required: true
    },
    savedForLater: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0
  },
  notes: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items
    .filter(item => !item.savedForLater)
    .reduce((total, item) => {
      if (item.product && item.product.price) {
        return total + (item.product.price * item.quantity);
      }
      return total + (item.priceAtAdd * item.quantity);
    }, 0);
});

// Get active items count
cartSchema.virtual('itemCount').get(function() {
  return this.items
    .filter(item => !item.savedForLater)
    .reduce((count, item) => count + item.quantity, 0);
});

// Get saved for later items
cartSchema.virtual('savedItems').get(function() {
  return this.items.filter(item => item.savedForLater);
});

// Get active cart items
cartSchema.virtual('activeItems').get(function() {
  return this.items.filter(item => !item.savedForLater);
});

// Calculate total with discount
cartSchema.virtual('total').get(function() {
  const subtotal = this.items
    .filter(item => !item.savedForLater)
    .reduce((total, item) => {
      if (item.product && item.product.price) {
        return total + (item.product.price * item.quantity);
      }
      return total + (item.priceAtAdd * item.quantity);
    }, 0);
  return Math.max(0, subtotal - this.couponDiscount);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Static method to get or create cart
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  return cart;
};

// Method to add item
cartSchema.methods.addItem = async function(productId, quantity, price) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString() && !item.savedForLater
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      priceAtAdd: price,
      savedForLater: false
    });
  }
  
  return this.save();
};

// Method to update quantity
cartSchema.methods.updateQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(
        i => i.product.toString() !== productId.toString()
      );
    } else {
      item.quantity = quantity;
    }
  }
  
  return this.save();
};

// Method to remove item
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.couponCode = undefined;
  this.couponDiscount = 0;
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
