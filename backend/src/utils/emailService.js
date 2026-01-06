const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Use environment variables for configuration
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Send email
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Carshahajjo" <noreply@carshahajjo.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - allow application to continue even if email fails
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Carshahajjo!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Carshahajjo!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>Thank you for joining Carshahajjo - Your Complete Car Management Platform.</p>
            <p>With Carshahajjo, you can:</p>
            <ul>
              <li>Manage your vehicles and documents</li>
              <li>Hire professional drivers</li>
              <li>Book car rentals</li>
              <li>Shop for car parts and accessories</li>
              <li>Connect with service centers</li>
              <li>And much more!</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Carshahajjo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetUrl) => {
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - Dhon Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background: #FF5722; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>You requested a password reset for your Dhon account.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p class="warning">
              <strong>⚠️ Important:</strong> This link expires in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Dhon Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (user, booking) => {
  return sendEmail({
    to: user.email,
    subject: 'Booking Confirmed - Dhon Platform',
    html: `
      <h1>Booking Confirmed!</h1>
      <p>Dear ${user.name},</p>
      <p>Your booking has been confirmed.</p>
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Booking ID: ${booking._id}</li>
        <li>Start Date: ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li>End Date: ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li>Total Amount: ${booking.totalAmount}</li>
      </ul>
      <p>Thank you for using Dhon!</p>
    `
  });
};

// Send document expiry reminder
const sendDocumentExpiryEmail = async (user, document, daysUntilExpiry) => {
  return sendEmail({
    to: user.email,
    subject: `Document Expiring Soon - ${document.type}`,
    html: `
      <h1>Document Expiry Reminder</h1>
      <p>Dear ${user.name},</p>
      <p>Your ${document.type} document is expiring in ${daysUntilExpiry} days.</p>
      <p><strong>Expiry Date:</strong> ${new Date(document.expiryDate).toLocaleDateString()}</p>
      <p>Please renew your document to continue using our services.</p>
      <a href="${process.env.CLIENT_URL}/documents">Update Document</a>
    `
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendDocumentExpiryEmail
};
