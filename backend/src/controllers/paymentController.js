const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const { sendNotification } = require('../utils/notificationService');

// Initialize payment
const initializePayment = async (req, res) => {
  try {
    const { amount, gateway, orderId, bookingId, currency = 'BDT' } = req.body;

    const payment = new Payment({
      user: req.user._id,
      amount,
      currency,
      gateway,
      status: 'pending',
      metadata: new Map()
    });

    if (orderId) {
      payment.metadata.set('orderId', orderId);
    }
    if (bookingId) {
      payment.metadata.set('bookingId', bookingId);
    }

    await payment.save();

    // Generate payment URL based on gateway
    let paymentUrl = '';
    let paymentData = {};

    switch (gateway) {
      case 'sslcommerz':
        paymentData = await initializeSSLCommerz(payment, req.user);
        paymentUrl = paymentData.GatewayPageURL;
        break;
      case 'stripe':
        paymentData = await initializeStripe(payment, req.user);
        paymentUrl = paymentData.url;
        break;
      case 'bkash':
        paymentData = await initializeBkash(payment, req.user);
        paymentUrl = paymentData.bkashURL;
        break;
      case 'nagad':
        paymentData = await initializeNagad(payment, req.user);
        paymentUrl = paymentData.callBackUrl;
        break;
      default:
        return res.status(400).json({ message: 'Invalid payment gateway' });
    }

    res.json({
      message: 'Payment initialized',
      paymentId: payment._id,
      paymentUrl,
      paymentData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SSLCommerz initialization (stub - implement with actual SDK)
const initializeSSLCommerz = async (payment, user) => {
  // In production, integrate with SSLCommerz SDK
  return {
    GatewayPageURL: `https://sandbox.sslcommerz.com/pay/${payment._id}`,
    sessionKey: `session_${payment._id}`,
    status: 'SUCCESS'
  };
};

// Stripe initialization (stub - implement with actual SDK)
const initializeStripe = async (payment, user) => {
  // In production, integrate with Stripe SDK
  return {
    url: `https://checkout.stripe.com/pay/${payment._id}`,
    sessionId: `cs_${payment._id}`
  };
};

// bKash initialization (stub - implement with actual SDK)
const initializeBkash = async (payment, user) => {
  // In production, integrate with bKash SDK
  return {
    bkashURL: `https://payment.bkash.com/${payment._id}`,
    paymentID: `bkash_${payment._id}`
  };
};

// Nagad initialization (stub - implement with actual SDK)
const initializeNagad = async (payment, user) => {
  // In production, integrate with Nagad SDK
  return {
    callBackUrl: `https://payment.nagad.com/${payment._id}`,
    paymentRefId: `nagad_${payment._id}`
  };
};

// Payment callback/webhook handler
const handlePaymentCallback = async (req, res) => {
  try {
    const { paymentId, transactionId, status, gateway } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.transactionId = transactionId;
    payment.status = status === 'success' ? 'completed' : 'failed';
    await payment.save();

    // Update related order or booking
    if (payment.metadata.has('orderId')) {
      const order = await Order.findById(payment.metadata.get('orderId'));
      if (order) {
        order.payment = payment._id;
        order.status = payment.status === 'completed' ? 'processing' : 'pending';
        await order.save();
      }
    }

    if (payment.metadata.has('bookingId')) {
      const booking = await Booking.findById(payment.metadata.get('bookingId'));
      if (booking) {
        booking.payment = payment._id;
        booking.deposit.paid = payment.status === 'completed';
        booking.status = payment.status === 'completed' ? 'confirmed' : 'pending';
        await booking.save();
      }
    }

    // Send notification
    await sendNotification({
      recipient: payment.user,
      type: 'payment',
      title: payment.status === 'completed' ? 'Payment Successful' : 'Payment Failed',
      message: payment.status === 'completed' 
        ? `Your payment of ${payment.currency} ${payment.amount} was successful.`
        : `Your payment of ${payment.currency} ${payment.amount} failed. Please try again.`
    });

    res.json({ message: 'Payment processed', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { status, gateway, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
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

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request refund
const requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed payments' });
    }

    if (payment.refundStatus !== 'none') {
      return res.status(400).json({ message: 'Refund already requested' });
    }

    payment.refundStatus = 'requested';
    payment.refundAmount = payment.amount;
    payment.metadata.set('refundReason', reason);
    await payment.save();

    // Notify admin
    await sendNotification({
      recipient: null, // Will be sent to all admins
      type: 'payment',
      title: 'Refund Requested',
      message: `User requested refund of ${payment.currency} ${payment.amount}. Reason: ${reason}`
    });

    res.json({ message: 'Refund requested successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Process refund (Admin only)
const processRefund = async (req, res) => {
  try {
    const { status, refundAmount } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.refundStatus !== 'requested') {
      return res.status(400).json({ message: 'No refund requested' });
    }

    payment.refundStatus = status === 'approve' ? 'processed' : 'none';
    if (status === 'approve') {
      payment.refundAmount = refundAmount || payment.amount;
      
      // In production, call payment gateway refund API here
      // await processGatewayRefund(payment);
      
      payment.refundStatus = 'completed';
      payment.status = 'refunded';
    }

    await payment.save();

    // Notify user
    await sendNotification({
      recipient: payment.user,
      type: 'payment',
      title: status === 'approve' ? 'Refund Processed' : 'Refund Rejected',
      message: status === 'approve' 
        ? `Your refund of ${payment.currency} ${payment.refundAmount} has been processed.`
        : 'Your refund request has been rejected.'
    });

    res.json({ message: `Refund ${status === 'approve' ? 'processed' : 'rejected'}`, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  initializePayment,
  handlePaymentCallback,
  getPaymentHistory,
  getPaymentById,
  requestRefund,
  processRefund
};
