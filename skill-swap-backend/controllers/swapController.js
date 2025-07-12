const { Swap, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Create a new swap request
const createSwapRequest = async (req, res) => {
  try {
    const {
      recipientId,
      requesterSkill,
      recipientSkill,
      message,
      scheduledDate,
      duration
    } = req.body;
    const requesterId = req.user.id;

    // Validation
    if (!recipientId || !requesterSkill || !recipientSkill) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID, requester skill, and recipient skill are required'
      });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create swap request with yourself'
      });
    }

    // Check if recipient exists and is not banned
    const recipient = await User.findByPk(recipientId);
    if (!recipient || recipient.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check if there's already a pending request between these users for the same skills
    const existingSwap = await Swap.findOne({
      where: {
        requesterId,
        recipientId,
        requesterSkill,
        recipientSkill,
        status: 'pending'
      }
    });

    if (existingSwap) {
      return res.status(400).json({
        success: false,
        message: 'A pending swap request already exists for these skills'
      });
    }

    // Create the swap request
    const swap = await Swap.create({
      requesterId,
      recipientId,
      requesterSkill,
      recipientSkill,
      message,
      scheduledDate,
      duration
    });

    // Create notification for recipient
    await Notification.create({
      userId: recipientId,
      message: `${req.user.name} sent you a skill swap request for ${recipientSkill}`,
      type: 'swap_request',
      relatedId: swap.id
    });

    // Fetch the created swap with user details
    const createdSwap = await Swap.findByPk(swap.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatarURL']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'avatarURL']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: { swap: createdSwap }
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating swap request'
    });
  }
};

// Get all swaps for current user
const getUserSwaps = async (req, res) => {
  try {
    const { status, type = 'all', page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Filter by type (sent, received, all)
    if (type === 'sent') {
      whereClause.requesterId = userId;
    } else if (type === 'received') {
      whereClause.recipientId = userId;
    } else {
      whereClause[Op.or] = [
        { requesterId: userId },
        { recipientId: userId }
      ];
    }

    // Filter by status
    if (status && ['pending', 'accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
      whereClause.status = status;
    }

    const { count, rows: swaps } = await Swap.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatarURL', 'rating']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'avatarURL', 'rating']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        swaps,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching swaps'
    });
  }
};

// Get swap by ID
const getSwapById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await Swap.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatarURL', 'rating']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'avatarURL', 'rating']
        }
      ]
    });

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is involved in this swap or is admin
    if (swap.requesterId !== userId && swap.recipientId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { swap }
    });
  } catch (error) {
    console.error('Get swap by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching swap'
    });
  }
};

// Update swap status (accept/reject)
const updateSwapStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    const swap = await Swap.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Only recipient can accept/reject
    if (swap.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can accept or reject this swap'
      });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending swaps can be accepted or rejected'
      });
    }

    // Update swap
    await swap.update({
      status,
      notes: notes || swap.notes
    });

    // Create notification for requester
    const notificationMessage = status === 'accepted'
      ? `${req.user.name} accepted your skill swap request`
      : `${req.user.name} rejected your skill swap request`;

    await Notification.create({
      userId: swap.requesterId,
      message: notificationMessage,
      type: status === 'accepted' ? 'swap_accepted' : 'swap_rejected',
      relatedId: swap.id
    });

    res.json({
      success: true,
      message: `Swap ${status} successfully`,
      data: { swap }
    });
  } catch (error) {
    console.error('Update swap status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating swap status'
    });
  }
};

// Cancel swap request
const cancelSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await Swap.findByPk(id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Only requester can cancel, and only if pending
    if (swap.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can cancel this swap'
      });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending swaps can be cancelled'
      });
    }

    await swap.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Swap cancelled successfully',
      data: { swap }
    });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling swap'
    });
  }
};

// Mark swap as completed
const completeSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await Swap.findByPk(id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Either participant can mark as completed
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (swap.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted swaps can be marked as completed'
      });
    }

    await swap.update({ status: 'completed' });

    res.json({
      success: true,
      message: 'Swap marked as completed',
      data: { swap }
    });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing swap'
    });
  }
};

// Get all swaps (admin only)
const getAllSwaps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: swaps } = await Swap.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        swaps,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching all swaps'
    });
  }
};

module.exports = {
  createSwapRequest,
  getUserSwaps,
  getSwapById,
  updateSwapStatus,
  cancelSwap,
  completeSwap,
  getAllSwaps
};
