const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { sendNotification } = require('../utils/notificationService');

// Create job posting (Owner only)
const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      owner: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get owner's jobs
const getMyJobs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { owner: req.user._id };
    
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate({
        path: 'applications',
        populate: { path: 'driver', select: 'name email phone profileImage' }
      })
      .populate('hiredDriver', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all jobs
const getJobs = async (req, res) => {
  try {
    const { status, location, carModel } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (location) filter['location.city'] = new RegExp(location, 'i');
    if (carModel) filter.carModel = new RegExp(carModel, 'i');

    const jobs = await Job.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate({
        path: 'applications',
        populate: { path: 'driver', select: 'name email phone' }
      });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update job (Owner only)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete job (Owner only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply for job (Driver only)
const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, expectedSalary, availability } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is not open for applications' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      driver: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    const application = new JobApplication({
      job: jobId,
      driver: req.user._id,
      coverLetter,
      expectedSalary,
      availability
    });

    await application.save();

    job.applications.push(application._id);
    await job.save();

    // Notify job owner
    await sendNotification({
      recipient: job.owner,
      type: 'job_application',
      title: 'New Job Application',
      message: `${req.user.name} has applied for your job: ${job.title}`,
      link: `/dashboard/jobs/${job._id}/applications`
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's applications (Driver only)
const getMyApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ driver: req.user._id })
      .populate('job')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update application status (Owner only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    application.updatedAt = new Date();

    await application.save();

    // Send notification to driver
    const statusMessages = {
      shortlisted: 'Congratulations! You have been shortlisted',
      rejected: 'Unfortunately, your application was not successful',
      accepted: 'Congratulations! You have been hired'
    };

    if (statusMessages[status]) {
      await sendNotification({
        recipient: application.driver._id,
        type: 'application_status',
        title: 'Application Status Update',
        message: `${statusMessages[status]} for: ${application.job.title}`,
        link: `/dashboard/applications/${applicationId}`
      });
    }

    // If accepted, update the job with hired driver
    if (status === 'accepted') {
      await Job.findByIdAndUpdate(application.job._id, {
        hiredDriver: application.driver._id,
        status: 'filled'
      });
    }

    res.json({ message: 'Application status updated', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Schedule interview (Owner only)
const scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { scheduledAt, duration, locationType, address, meetingLink, phone, notes } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = 'interview_scheduled';
    application.interview = {
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      location: {
        type: locationType,
        address,
        meetingLink,
        phone
      },
      notes,
      status: 'scheduled'
    };
    application.updatedAt = new Date();

    await application.save();

    // Notify driver about the interview
    await sendNotification({
      recipient: application.driver._id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your interview for ${application.job.title} has been scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      link: `/dashboard/applications/${applicationId}`
    });

    res.json({ message: 'Interview scheduled successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update interview status (Owner only)
const updateInterviewStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, rating, comments } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.interview.status = status;
    
    if (status === 'completed' && (rating || comments)) {
      application.interview.feedback = {
        rating,
        comments,
        conductedBy: req.user._id,
        conductedAt: new Date()
      };
      application.status = 'interview_completed';
    }

    application.updatedAt = new Date();
    await application.save();

    res.json({ message: 'Interview status updated', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create contract (Owner only)
const createContract = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { terms, expiresAt } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.contract = {
      terms: {
        salary: terms.salary || application.job.salary.amount,
        salaryPeriod: terms.salaryPeriod || application.job.salary.period,
        startDate: terms.startDate || application.job.startDate,
        endDate: terms.endDate || application.job.endDate,
        workingHours: terms.workingHours,
        benefits: terms.benefits || application.job.benefits,
        responsibilities: terms.responsibilities || application.job.requirements,
        terminationClause: terms.terminationClause
      },
      status: 'pending_driver',
      sentAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    };

    application.updatedAt = new Date();
    await application.save();

    // Notify driver about the contract
    await sendNotification({
      recipient: application.driver._id,
      type: 'contract_created',
      title: 'Contract Ready for Review',
      message: `A contract has been created for ${application.job.title}. Please review and sign.`,
      link: `/dashboard/applications/${applicationId}/contract`
    });

    res.json({ message: 'Contract created and sent to driver', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Sign contract (Driver or Owner)
const signContract = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { signatureUrl } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isOwner = application.job.owner.toString() === req.user._id.toString();
    const isDriver = application.driver._id.toString() === req.user._id.toString();

    if (!isOwner && !isDriver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check contract status
    if (application.contract.status === 'signed') {
      return res.status(400).json({ message: 'Contract already fully signed' });
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (isDriver) {
      if (application.contract.status !== 'pending_driver') {
        return res.status(400).json({ message: 'Contract is not pending your signature' });
      }
      application.contract.signatures.driver = {
        signed: true,
        signedAt: new Date(),
        signatureUrl,
        ipAddress: clientIP
      };
      application.contract.status = 'pending_owner';

      // Notify owner
      await sendNotification({
        recipient: application.job.owner,
        type: 'contract_signed',
        title: 'Contract Signed by Driver',
        message: `${application.driver.name} has signed the contract for ${application.job.title}`,
        link: `/dashboard/applications/${applicationId}/contract`
      });
    }

    if (isOwner) {
      if (application.contract.status !== 'pending_owner') {
        return res.status(400).json({ message: 'Driver has not signed yet' });
      }
      application.contract.signatures.owner = {
        signed: true,
        signedAt: new Date(),
        signatureUrl,
        ipAddress: clientIP
      };
      application.contract.status = 'signed';
      application.status = 'accepted';

      // Update job as filled
      await Job.findByIdAndUpdate(application.job._id, {
        hiredDriver: application.driver._id,
        status: 'filled'
      });

      // Notify driver
      await sendNotification({
        recipient: application.driver._id,
        type: 'contract_completed',
        title: 'Contract Completed',
        message: `Congratulations! The contract for ${application.job.title} has been fully signed.`,
        link: `/dashboard/applications/${applicationId}/contract`
      });
    }

    application.updatedAt = new Date();
    await application.save();

    res.json({ message: 'Contract signed successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Withdraw application (Driver only)
const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId).populate('job');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['accepted', 'rejected'].includes(application.status)) {
      return res.status(400).json({ message: 'Cannot withdraw application at this stage' });
    }

    application.status = 'withdrawn';
    application.updatedAt = new Date();
    await application.save();

    // Notify owner
    await sendNotification({
      recipient: application.job.owner,
      type: 'application_withdrawn',
      title: 'Application Withdrawn',
      message: `${req.user.name} has withdrawn their application for ${application.job.title}`,
      link: `/dashboard/jobs/${application.job._id}/applications`
    });

    res.json({ message: 'Application withdrawn successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get application details
const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email phone profileImage experience licenses');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check authorization
    const isOwner = application.job.owner.toString() === req.user._id.toString();
    const isDriver = application.driver._id.toString() === req.user._id.toString();

    if (!isOwner && !isDriver && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message in application (chat)
const sendApplicationMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { content } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('driver', 'name email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isOwner = application.job.owner.toString() === req.user._id.toString();
    const isDriver = application.driver._id.toString() === req.user._id.toString();

    if (!isOwner && !isDriver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.messages.push({
      sender: req.user._id,
      content,
      createdAt: new Date()
    });

    application.updatedAt = new Date();
    await application.save();

    // Notify the other party
    const recipientId = isOwner ? application.driver._id : application.job.owner;
    await sendNotification({
      recipient: recipientId,
      type: 'application_message',
      title: 'New Message',
      message: `You have a new message regarding ${application.job.title}`,
      link: `/dashboard/applications/${applicationId}`
    });

    res.json({ message: 'Message sent successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus,
  scheduleInterview,
  updateInterviewStatus,
  createContract,
  signContract,
  withdrawApplication,
  sendApplicationMessage
};
