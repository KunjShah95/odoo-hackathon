const express = require('express');
const router = express.Router();
const { User, Swap, Feedback, Notification } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const userStats = {
      total: await User.count(),
      active: await User.count({ where: { isBanned: false } }),
      banned: await User.count({ where: { isBanned: true } }),
      newThisMonth: await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    const swapStats = {
      total: await Swap.count(),
      pending: await Swap.count({ where: { status: 'pending' } }),
      accepted: await Swap.count({ where: { status: 'accepted' } }),
      completed: await Swap.count({ where: { status: 'completed' } }),
      thisMonth: await Swap.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    const feedbackStats = {
      total: await Feedback.count(),
      thisMonth: await Feedback.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    res.json({
      success: true,
      data: {
        users: userStats,
        swaps: swapStats,
        feedback: feedbackStats
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// Send platform-wide notification
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { message, type = 'platform_update' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Create notification for all users
    await Notification.create({
      userId: null, // null means platform-wide
      message,
      type,
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Broadcast notification sent successfully'
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending broadcast notification'
    });
  }
});

// Get reports/export data
router.get('/reports/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'location', 'isPublic', 'isBanned', 'rating', 'totalRatings', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('User reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating user report'
    });
  }
});

router.get('/reports/swaps', async (req, res) => {
  try {
    const swaps = await Swap.findAll({
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { swaps }
    });
  } catch (error) {
    console.error('Swap reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating swap report'
    });
  }
});

router.get('/reports/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'ratedUser',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Feedback reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating feedback report'
    });
  }
});

// Moderate content
router.put('/moderate/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'warn', 'ban', 'unban'

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot moderate admin users'
      });
    }

    let updateData = {};
    let notificationMessage = '';

    switch (action) {
      case 'ban':
        updateData.isBanned = true;
        notificationMessage = `Your account has been banned. Reason: ${reason}`;
        break;
      case 'unban':
        updateData.isBanned = false;
        notificationMessage = 'Your account has been unbanned.';
        break;
      case 'warn':
        notificationMessage = `Warning: ${reason}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    // Send notification to user
    await Notification.create({
      userId: user.id,
      message: notificationMessage,
      type: 'system_alert',
      priority: 'high'
    });

    res.json({
      success: true,
      message: `User ${action}ed successfully`,
      data: { user, action, reason }
    });
  } catch (error) {
    console.error('Moderate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error moderating user'
    });
  }
});

module.exports = router;
