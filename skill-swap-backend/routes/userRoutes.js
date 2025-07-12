const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  searchUsersBySkill,
  getUserStats,
  toggleUserBan
} = require('../controllers/userController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, getAllUsers);
router.get('/search', optionalAuth, searchUsersBySkill);
router.get('/:id', optionalAuth, getUserById);

// Admin only routes
router.get('/admin/stats', authenticateToken, requireAdmin, getUserStats);
router.put('/:id/ban', authenticateToken, requireAdmin, toggleUserBan);

module.exports = router;
