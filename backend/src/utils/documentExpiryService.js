const Car = require('../models/Car');
const { sendNotification } = require('./notificationService');

/**
 * Document Expiry Reminder Service
 * Checks for expiring documents and sends reminders
 */

// Reminder intervals (days before expiry)
const REMINDER_INTERVALS = [30, 14, 7, 3, 1];

/**
 * Check and send reminders for expiring documents
 */
const checkExpiringDocuments = async () => {
  try {
    console.log('Running document expiry check...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all cars with documents
    const cars = await Car.find({
      'documents.expiryDate': { $exists: true }
    }).populate('owner', 'name email');

    let remindersSent = 0;
    let documentsExpired = 0;

    for (const car of cars) {
      for (const doc of car.documents) {
        if (!doc.expiryDate) continue;

        const expiryDate = new Date(doc.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        // Check if document has expired
        if (daysUntilExpiry < 0 && doc.verificationStatus !== 'expired') {
          doc.verificationStatus = 'expired';
          documentsExpired++;

          // Send expiry notification
          await sendNotification({
            recipient: car.owner._id,
            type: 'document_expired',
            title: 'Document Expired',
            message: `Your ${doc.type.toUpperCase()} for ${car.make} ${car.model} has expired. Please upload a new document.`,
            link: `/dashboard/cars/${car._id}/documents`
          });

          // Notify admins
          await sendNotification({
            recipient: null,
            type: 'document_expired',
            title: 'Document Expired - Admin Alert',
            message: `${doc.type.toUpperCase()} for ${car.make} ${car.model} (${car.owner.name}) has expired.`,
            link: `/admin/cars/${car._id}/documents`
          });
        }

        // Check if reminder should be sent
        if (daysUntilExpiry > 0 && REMINDER_INTERVALS.includes(daysUntilExpiry)) {
          // Check if reminder already sent for this interval
          const alreadySent = doc.remindersSent?.some(
            r => r.daysBeforeExpiry === daysUntilExpiry
          );

          if (!alreadySent) {
            // Send reminder
            await sendNotification({
              recipient: car.owner._id,
              type: 'document_expiry_reminder',
              title: 'Document Expiring Soon',
              message: `Your ${doc.type.toUpperCase()} for ${car.make} ${car.model} will expire in ${daysUntilExpiry} day(s). Please renew it.`,
              link: `/dashboard/cars/${car._id}/documents`
            });

            // Record reminder sent
            if (!doc.remindersSent) {
              doc.remindersSent = [];
            }
            doc.remindersSent.push({
              sentAt: new Date(),
              daysBeforeExpiry: daysUntilExpiry
            });

            remindersSent++;
          }
        }
      }

      // Save car if any documents were updated
      await car.save();
    }

    console.log(`Document expiry check complete. Reminders sent: ${remindersSent}, Documents expired: ${documentsExpired}`);
    
    return { remindersSent, documentsExpired };
  } catch (error) {
    console.error('Error checking document expiry:', error);
    throw error;
  }
};

/**
 * Get document expiry statistics
 */
const getExpiryStats = async () => {
  try {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    const cars = await Car.find({
      'documents.expiryDate': { $exists: true }
    });

    let expired = 0;
    let expiringIn7Days = 0;
    let expiringIn30Days = 0;
    let valid = 0;

    cars.forEach(car => {
      car.documents.forEach(doc => {
        if (!doc.expiryDate) return;
        
        const expiryDate = new Date(doc.expiryDate);
        
        if (expiryDate < today) {
          expired++;
        } else if (expiryDate <= next7Days) {
          expiringIn7Days++;
        } else if (expiryDate <= next30Days) {
          expiringIn30Days++;
        } else {
          valid++;
        }
      });
    });

    return {
      expired,
      expiringIn7Days,
      expiringIn30Days,
      valid,
      total: expired + expiringIn7Days + expiringIn30Days + valid
    };
  } catch (error) {
    console.error('Error getting expiry stats:', error);
    throw error;
  }
};

/**
 * Manual trigger to send reminder for specific document
 */
const sendDocumentReminder = async (carId, documentId) => {
  try {
    const car = await Car.findById(carId).populate('owner', 'name email');
    if (!car) {
      throw new Error('Car not found');
    }

    const doc = car.documents.id(documentId);
    if (!doc) {
      throw new Error('Document not found');
    }

    await sendNotification({
      recipient: car.owner._id,
      type: 'document_reminder_manual',
      title: 'Document Reminder',
      message: `Please update your ${doc.type.toUpperCase()} for ${car.make} ${car.model}. It expires on ${new Date(doc.expiryDate).toLocaleDateString()}.`,
      link: `/dashboard/cars/${car._id}/documents`
    });

    return { success: true, message: 'Reminder sent successfully' };
  } catch (error) {
    console.error('Error sending document reminder:', error);
    throw error;
  }
};

module.exports = {
  checkExpiringDocuments,
  getExpiryStats,
  sendDocumentReminder,
  REMINDER_INTERVALS
};
