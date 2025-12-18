const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  updateApplicationStatus
} = require('../controllers/jobController');
const { authenticate, checkApproval, authorize } = require('../middleware/auth');

// Job routes
router.post('/', authenticate, checkApproval, authorize('owner'), createJob);
router.get('/', authenticate, getJobs);
router.get('/:id', authenticate, getJobById);
router.put('/:id', authenticate, checkApproval, authorize('owner'), updateJob);
router.delete('/:id', authenticate, checkApproval, authorize('owner'), deleteJob);

// Application routes
router.post('/apply', authenticate, checkApproval, authorize('driver'), applyForJob);
router.get('/applications/my', authenticate, checkApproval, authorize('driver'), getMyApplications);
router.put('/applications/:applicationId', authenticate, checkApproval, authorize('owner'), updateApplicationStatus);

module.exports = router;
