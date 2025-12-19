const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

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
    const { jobId, coverLetter } = req.body;

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
      coverLetter
    });

    await application.save();

    job.applications.push(application._id);
    await job.save();

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
    const { status, interview } = req.body;

    const application = await JobApplication.findById(applicationId).populate('job');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    application.updatedAt = new Date();

    if (interview) {
      application.interview = interview;
    }

    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  updateApplicationStatus
};
