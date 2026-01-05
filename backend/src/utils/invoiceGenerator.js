const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF invoice for an order
 * @param {Object} order - The order object with populated fields
 * @returns {Promise<string>} - The URL path to the generated invoice
 */
const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      // Ensure invoices directory exists
      const invoicesDir = path.join(__dirname, '../../uploads/invoices');
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `invoice-${order.orderNumber || order._id}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Company Info
      doc.fontSize(12)
        .text('Dhon Auto Services', { align: 'left' })
        .text('123 Main Street', { align: 'left' })
        .text('City, State 12345', { align: 'left' })
        .text('Phone: (555) 123-4567', { align: 'left' })
        .text('Email: support@dhonauto.com', { align: 'left' });

      doc.moveDown();

      // Invoice details
      doc.fontSize(10)
        .text(`Invoice Number: INV-${order.orderNumber || order._id}`, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' })
        .text(`Order Number: ${order.orderNumber || order._id}`, { align: 'right' });

      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Bill To
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10);
      
      if (order.customer) {
        doc.text(order.customer.name || 'Customer');
        doc.text(order.customer.email || '');
        doc.text(order.customer.phone || '');
      }

      if (order.shippingAddress) {
        doc.text(order.shippingAddress.street || '');
        doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}`);
        doc.text(order.shippingAddress.country || '');
      }

      doc.moveDown();

      // Items table header
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 150;
      const quantityX = 350;
      const priceX = 420;
      const amountX = 490;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', itemCodeX, tableTop);
      doc.text('Description', descriptionX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Price', priceX, tableTop);
      doc.text('Amount', amountX, tableTop);

      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Items
      doc.font('Helvetica');
      let y = doc.y;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, i) => {
          const itemName = item.product?.name || item.productSnapshot?.name || `Item ${i + 1}`;
          const truncatedName = itemName.length > 15 ? itemName.substring(0, 15) + '...' : itemName;
          const description = item.product?.sku || item.productSnapshot?.sku || '';
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const amount = quantity * price;

          doc.text(truncatedName, itemCodeX, y);
          doc.text(description, descriptionX, y);
          doc.text(quantity.toString(), quantityX, y);
          doc.text(`$${price.toFixed(2)}`, priceX, y);
          doc.text(`$${amount.toFixed(2)}`, amountX, y);

          y += 20;

          // Add new page if needed
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });
      }

      doc.y = y;
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totals
      const totalsX = 400;
      let totalsY = doc.y;

      doc.text('Subtotal:', totalsX, totalsY);
      doc.text(`$${(order.subtotal || 0).toFixed(2)}`, amountX, totalsY);
      totalsY += 15;

      if (order.shippingCost) {
        doc.text('Shipping:', totalsX, totalsY);
        doc.text(`$${order.shippingCost.toFixed(2)}`, amountX, totalsY);
        totalsY += 15;
      }

      if (order.taxAmount) {
        doc.text('Tax:', totalsX, totalsY);
        doc.text(`$${order.taxAmount.toFixed(2)}`, amountX, totalsY);
        totalsY += 15;
      }

      if (order.discount && order.discount.amount > 0) {
        doc.text('Discount:', totalsX, totalsY);
        doc.text(`-$${order.discount.amount.toFixed(2)}`, amountX, totalsY);
        totalsY += 15;
      }

      doc.font('Helvetica-Bold');
      doc.text('Total:', totalsX, totalsY);
      doc.text(`$${(order.totalAmount || 0).toFixed(2)}`, amountX, totalsY);

      doc.moveDown();
      doc.moveDown();

      // Payment info
      doc.font('Helvetica').fontSize(10);
      if (order.payment) {
        doc.text(`Payment Method: ${order.payment.method || 'N/A'}`);
        doc.text(`Payment Status: ${order.payment.status || 'Pending'}`);
      }

      // Footer
      doc.moveDown();
      doc.moveDown();
      doc.fontSize(8).text('Thank you for your business!', { align: 'center' });
      doc.text('If you have any questions about this invoice, please contact us.', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/invoices/${fileName}`);
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a simple invoice without PDFKit (fallback)
 * Returns a JSON representation that can be rendered client-side
 */
const generateInvoiceData = (order) => {
  return {
    invoiceNumber: `INV-${order.orderNumber || order._id}`,
    date: new Date(order.createdAt).toLocaleDateString(),
    orderNumber: order.orderNumber || order._id,
    customer: order.customer ? {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone
    } : null,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    items: order.items?.map(item => ({
      name: item.product?.name || item.productSnapshot?.name,
      sku: item.product?.sku || item.productSnapshot?.sku,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    })) || [],
    subtotal: order.subtotal || 0,
    shippingCost: order.shippingCost || 0,
    taxAmount: order.taxAmount || 0,
    discount: order.discount?.amount || 0,
    totalAmount: order.totalAmount || 0,
    payment: order.payment ? {
      method: order.payment.method,
      status: order.payment.status
    } : null
  };
};

module.exports = {
  generateInvoice,
  generateInvoiceData
};
