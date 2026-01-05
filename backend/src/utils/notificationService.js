const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

// Send notification through multiple channels
const sendNotification = async ({ recipient, type, title, message, link, data }) => {
  try {
    // If recipient is null, send to all admins
    let recipients = [];
    
    if (!recipient) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      recipients = admins.map(a => a._id);
    } else {
      recipients = [recipient];
    }

    const notifications = [];

    for (const recipientId of recipients) {
      const user = await User.findById(recipientId);
      if (!user || !user.isActive) continue;

      const settings = user.notificationSettings || {
        email: true,
        sms: false,
        push: true,
        categories: {}
      };

      // Check if user wants notifications for this category
      const categoryEnabled = settings.categories?.[type] !== false;
      if (!categoryEnabled) continue;

      // Create in-app notification
      const notification = new Notification({
        recipient: recipientId,
        type,
        title,
        message,
        link,
        channels: {
          email: settings.email,
          sms: settings.sms,
          push: settings.push
        }
      });

      await notification.save();
      notifications.push(notification);

      // Send email notification if enabled
      if (settings.email) {
        await sendEmailNotification(user, title, message, link);
      }

      // Send SMS notification if enabled
      if (settings.sms && user.phone) {
        await sendSMSNotification(user.phone, message);
      }

      // Send push notification if enabled
      if (settings.push) {
        await sendPushNotification(recipientId, title, message, data);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Notification error:', error);
    return [];
  }
};

// Send email notification
const sendEmailNotification = async (user, title, message, link) => {
  try {
    await sendEmail({
      to: user.email,
      subject: title,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>Hello ${user.name},</p>
              <p>${message}</p>
              ${link ? `<p><a href="${process.env.CLIENT_URL}${link}" class="button">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dhon Platform. All rights reserved.</p>
              <p><a href="${process.env.CLIENT_URL}/settings/notifications">Manage Notification Preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
};

// Send SMS notification (stub - implement with Twilio/Nexmo/etc.)
const sendSMSNotification = async (phone, message) => {
  try {
    // In production, integrate with SMS provider like Twilio
    console.log(`SMS to ${phone}: ${message}`);
    
    // Example Twilio integration:
    // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    return { success: true };
  } catch (error) {
    console.error('SMS notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification (stub - implement with Firebase/OneSignal)
const sendPushNotification = async (userId, title, message, data) => {
  try {
    // In production, integrate with Firebase Cloud Messaging or OneSignal
    console.log(`Push to ${userId}: ${title} - ${message}`);
    
    // Example Firebase Cloud Messaging integration:
    // const admin = require('firebase-admin');
    // const user = await User.findById(userId);
    // if (user.fcmToken) {
    //   await admin.messaging().send({
    //     token: user.fcmToken,
    //     notification: { title, body: message },
    //     data
    //   });
    // }
    
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Schedule notification (for reminders, etc.)
const scheduleNotification = async ({ recipient, type, title, message, link, sendAt }) => {
  try {
    // In production, use a job scheduler like Bull or Agenda
    const delay = new Date(sendAt).getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if scheduled time has passed
      return sendNotification({ recipient, type, title, message, link });
    }

    // For now, use setTimeout (in production, use a proper job queue)
    setTimeout(() => {
      sendNotification({ recipient, type, title, message, link });
    }, delay);

    return { scheduled: true, sendAt };
  } catch (error) {
    console.error('Schedule notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk notification
const sendBulkNotification = async ({ recipients, type, title, message, link }) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendNotification({ recipient, type, title, message, link });
    results.push(...result);
  }
  
  return results;
};

module.exports = {
  sendNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendPushNotification,
  scheduleNotification,
  sendBulkNotification
};
