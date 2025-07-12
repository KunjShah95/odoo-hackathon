const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getUserFeedback,
  getFeedbackByUser,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');

// Public routes
router.get('/user/:userId', optionalAuth, getUserFeedback);

// Protected routes
router.post('/', authenticateToken, createFeedback);
router.get('/by-user/:userId', authenticateToken, getFeedbackByUser);
router.put('/:id', authenticateToken, updateFeedback);
router.delete('/:id', authenticateToken, deleteFeedback);

// Admin routes
router.get('/admin/stats', authenticateToken, requireAdmin, getFeedbackStats);

module.exports = router;
