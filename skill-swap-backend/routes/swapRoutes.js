const express = require('express');
const router = express.Router();
const {
  createSwapRequest,
  getUserSwaps,
  getSwapById,
  updateSwapStatus,
  cancelSwap,
  completeSwap,
  getAllSwaps
} = require('../controllers/swapController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All swap routes require authentication
router.use(authenticateToken);

// User swap routes
router.post('/', createSwapRequest);
router.get('/my-swaps', getUserSwaps);
router.get('/:id', getSwapById);
router.put('/:id/status', updateSwapStatus);
router.put('/:id/cancel', cancelSwap);
router.put('/:id/complete', completeSwap);

// Admin routes
router.get('/admin/all', requireAdmin, getAllSwaps);

module.exports = router;
