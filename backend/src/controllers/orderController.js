const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { sendNotification } = require('../utils/notificationService');

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.activeItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check stock availability and build items
    const orderItems = [];
    const stockIssues = [];

    for (const item of cart.activeItems) {
      if (!item.product || !item.product.isActive) {
        stockIssues.push({ name: item.product?.name || 'Unknown', issue: 'Product unavailable' });
        continue;
      }

      if (item.product.trackInventory && item.product.stock < item.quantity) {
        stockIssues.push({ 
          name: item.product.name, 
          issue: 'Insufficient stock',
          available: item.product.stock 
        });
        continue;
      }

      orderItems.push({
        product: item.product._id,
        productSnapshot: {
          name: item.product.name,
          sku: item.product.sku,
          image: item.product.images?.[0]?.url
        },
        vendor: item.product.vendor,
        quantity: item.quantity,
        price: item.product.price,
        totalPrice: item.product.price * item.quantity
      });
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({ 
        message: 'Some items have availability issues',
        issues: stockIssues 
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const discount = cart.couponDiscount || 0;
    const totalAmount = subtotal + shippingCost + taxAmount - discount;

    // Create order
    const order = new Order({
      customer: req.user._id,
      items: orderItems,
      subtotal,
      shippingCost,
      taxAmount,
      discount: {
        code: cart.couponCode,
        amount: discount
      },
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress?.sameAsShipping ? { ...shippingAddress, sameAsShipping: true } : billingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      notes: {
        customer: notes
      },
      statusHistory: [{
        status: 'pending',
        note: 'Order placed'
      }]
    });

    await order.save();

    // Update product stock and vendor sales
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSold: item.quantity }
      });

      if (item.vendor) {
        await Vendor.findByIdAndUpdate(item.vendor, {
          $inc: { totalSales: item.totalPrice }
        });
      }
    }

    // Clear cart
    await cart.clearCart();

    // Send notification
    await sendNotification({
      recipient: req.user._id,
      type: 'payment',
      title: 'Order Placed',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    // Notify vendors
    const vendorIds = [...new Set(orderItems.filter(i => i.vendor).map(i => i.vendor.toString()))];
    for (const vendorId of vendorIds) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        await sendNotification({
          recipient: vendor.user,
          type: 'order',
          title: 'New Order Received',
          message: `You have received a new order #${order.orderNumber}`,
          data: { orderId: order._id }
        });
      }
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      order,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user orders
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.customer = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
      .populate('customer', 'name email phone')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
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

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('customer', 'name email phone')
      .populate('payment');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, carrier } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (trackingNumber) {
      order.tracking = {
        trackingNumber,
        carrier,
        updatedAt: new Date()
      };
    }

    await order.save();

    // Send notification to customer
    await sendNotification({
      recipient: order.customer,
      type: 'payment',
      title: 'Order Update',
      message: `Your order #${order._id} status has been updated to ${status}.`
    });

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel shipped or delivered orders' });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = 'cancelled';
    await order.save();

    // If payment was made, initiate refund
    if (order.payment) {
      const payment = await Payment.findById(order.payment);
      if (payment && payment.status === 'completed') {
        payment.refundStatus = 'requested';
        payment.refundAmount = order.totalAmount;
        await payment.save();
      }
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order invoice
const getOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price')
      .populate('customer', 'name email phone address');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate or return existing invoice
    if (!order.invoiceUrl) {
      const invoiceUrl = await generateInvoice(order);
      order.invoiceUrl = invoiceUrl;
      await order.save();
    }

    res.json({ invoiceUrl: order.invoiceUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderInvoice
};
