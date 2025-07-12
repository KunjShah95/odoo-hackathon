const { Feedback, Swap, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Create feedback for a completed swap
const createFeedback = async (req, res) => {
  try {
    const { swapId, rating, comment, isPublic = true } = req.body;
    const raterId = req.user.id;

    // Validation
    if (!swapId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Swap ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get the swap and verify it's completed
    const swap = await Swap.findByPk(swapId);
    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    if (swap.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only leave feedback for completed swaps'
      });
    }

    // Verify the user was part of this swap
    if (swap.requesterId !== raterId && swap.recipientId !== raterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only leave feedback for your own swaps'
      });
    }

    // Determine who is being rated
    const ratedUserId = swap.requesterId === raterId ? swap.recipientId : swap.requesterId;

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      where: { swapId, raterId }
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already exists for this swap'
      });
    }

    // Create feedback using transaction
    const result = await sequelize.transaction(async (t) => {
      // Create the feedback
      const feedback = await Feedback.create({
        swapId,
        raterId,
        ratedUserId,
        rating,
        comment,
        isPublic
      }, { transaction: t });

      // Update the rated user's overall rating
      const userFeedback = await Feedback.findAll({
        where: { ratedUserId },
        transaction: t
      });

      const totalRating = userFeedback.reduce((sum, fb) => sum + fb.rating, 0);
      const avgRating = totalRating / userFeedback.length;

      await User.update(
        {
          rating: parseFloat(avgRating.toFixed(2)),
          totalRatings: userFeedback.length
        },
        {
          where: { id: ratedUserId },
          transaction: t
        }
      );

      return feedback;
    });

    // Create notification for the rated user
    await Notification.create({
      userId: ratedUserId,
      message: `${req.user.name} left you feedback with ${rating} stars`,
      type: 'feedback_received',
      relatedId: result.id
    });

    // Fetch the feedback with user details
    const feedbackWithDetails = await Feedback.findByPk(result.id, {
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'name', 'avatarURL']
        },
        {
          model: User,
          as: 'ratedUser',
          attributes: ['id', 'name', 'avatarURL']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: { feedback: feedbackWithDetails }
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating feedback'
    });
  }
};

// Get feedback for a user
const getUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { count, rows: feedback } = await Feedback.findAndCountAll({
      where: {
        ratedUserId: userId,
        isPublic: true
      },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'name', 'avatarURL']
        },
        {
          model: Swap,
          attributes: ['id', 'requesterSkill', 'recipientSkill']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate rating distribution
    const ratingDistribution = await Feedback.findAll({
      where: { ratedUserId: userId, isPublic: true },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        feedback,
        ratingDistribution,
        userRating: {
          average: user.rating,
          total: user.totalRatings
        },
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feedback'
    });
  }
};

// Get feedback given by a user
const getFeedbackByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Verify the user is accessing their own feedback or is an admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { count, rows: feedback } = await Feedback.findAndCountAll({
      where: { raterId: userId },
      include: [
        {
          model: User,
          as: 'ratedUser',
          attributes: ['id', 'name', 'avatarURL']
        },
        {
          model: Swap,
          attributes: ['id', 'requesterSkill', 'recipientSkill']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get feedback by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feedback'
    });
  }
};

// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, isPublic } = req.body;
    const userId = req.user.id;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only the person who gave the feedback can update it
    if (feedback.raterId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback'
      });
    }

    // Update feedback
    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) updateData.comment = comment;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await sequelize.transaction(async (t) => {
      await feedback.update(updateData, { transaction: t });

      // Recalculate the rated user's average rating if rating changed
      if (rating !== undefined) {
        const userFeedback = await Feedback.findAll({
          where: { ratedUserId: feedback.ratedUserId },
          transaction: t
        });

        const totalRating = userFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        const avgRating = totalRating / userFeedback.length;

        await User.update(
          {
            rating: parseFloat(avgRating.toFixed(2)),
            totalRatings: userFeedback.length
          },
          {
            where: { id: feedback.ratedUserId },
            transaction: t
          }
        );
      }
    });

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating feedback'
    });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only the person who gave the feedback or admin can delete it
    if (feedback.raterId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await sequelize.transaction(async (t) => {
      await feedback.destroy({ transaction: t });

      // Recalculate the rated user's average rating
      const userFeedback = await Feedback.findAll({
        where: { ratedUserId: feedback.ratedUserId },
        transaction: t
      });

      let avgRating = 0;
      if (userFeedback.length > 0) {
        const totalRating = userFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        avgRating = totalRating / userFeedback.length;
      }

      await User.update(
        {
          rating: parseFloat(avgRating.toFixed(2)),
          totalRatings: userFeedback.length
        },
        {
          where: { id: feedback.ratedUserId },
          transaction: t
        }
      );
    });

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting feedback'
    });
  }
};

// Get feedback statistics (admin)
const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.count();
    const avgRating = await Feedback.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average']
      ]
    });

    const ratingDistribution = await Feedback.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        stats: {
          total: totalFeedback,
          averageRating: parseFloat(avgRating.dataValues.average || 0).toFixed(2)
        },
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feedback statistics'
    });
  }
};

module.exports = {
  createFeedback,
  getUserFeedback,
  getFeedbackByUser,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats
};
