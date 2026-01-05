const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/jobController');
const { authenticate, checkApproval, authorize } = require('../middleware/auth');

// Job routes
router.post('/', authenticate, checkApproval, authorize('owner'), createJob);
router.get('/', authenticate, getJobs);
router.get('/my-jobs', authenticate, checkApproval, authorize('owner'), getMyJobs);
router.get('/:id', authenticate, getJobById);
router.put('/:id', authenticate, checkApproval, authorize('owner'), updateJob);
router.delete('/:id', authenticate, checkApproval, authorize('owner'), deleteJob);

// Application routes
router.post('/apply', authenticate, checkApproval, authorize('driver'), applyForJob);
router.get('/applications/my', authenticate, checkApproval, authorize('driver'), getMyApplications);
router.get('/applications/:applicationId', authenticate, getApplicationById);
router.put('/applications/:applicationId/status', authenticate, checkApproval, authorize('owner'), updateApplicationStatus);
router.post('/applications/:applicationId/withdraw', authenticate, checkApproval, authorize('driver'), withdrawApplication);

// Interview routes
router.post('/applications/:applicationId/interview', authenticate, checkApproval, authorize('owner'), scheduleInterview);
router.put('/applications/:applicationId/interview/status', authenticate, checkApproval, authorize('owner'), updateInterviewStatus);

// Contract routes
router.post('/applications/:applicationId/contract', authenticate, checkApproval, authorize('owner'), createContract);
router.post('/applications/:applicationId/contract/sign', authenticate, checkApproval, signContract);

// Messaging routes
router.post('/applications/:applicationId/messages', authenticate, checkApproval, sendApplicationMessage);

module.exports = router;
