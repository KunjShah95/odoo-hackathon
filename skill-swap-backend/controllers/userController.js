const { User, Swap, Feedback } = require('../models');
const { Op } = require('sequelize');

// Get all users (with filtering and search)
const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      skill,
      location,
      page = 1,
      limit = 10,
      includePrivate = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      isBanned: false
    };

    // Only include public profiles unless admin
    if (!includePrivate || !req.user?.isAdmin) {
      whereClause.isPublic = true;
    }

    // Search filters
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { bio: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (skill) {
      whereClause[Op.or] = [
        { skillsOffered: { [Op.contains]: [skill] } },
        { skillsWanted: { [Op.contains]: [skill] } }
      ];
    }

    if (location) {
      whereClause.location = { [Op.iLike]: `%${location}%` };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['hashedPassword'] }
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => user.getPublicProfile()),
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['hashedPassword'] },
      include: [
        {
          model: Feedback,
          as: 'receivedFeedback',
          include: [
            {
              model: User,
              as: 'rater',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and requester is not the owner or admin
    if (!user.isPublic &&
      (!req.user || (req.user.id !== user.id && !req.user.isAdmin))) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        feedback: user.receivedFeedback
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

// Search users by skills
const searchUsersBySkill = async (req, res) => {
  try {
    const { skill, type = 'offered' } = req.query;

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill parameter is required'
      });
    }

    const skillField = type === 'offered' ? 'skillsOffered' : 'skillsWanted';

    const users = await User.findAll({
      where: {
        [skillField]: { [Op.contains]: [skill] },
        isPublic: true,
        isBanned: false
      },
      attributes: { exclude: ['hashedPassword'] },
      order: [['rating', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => user.getPublicProfile()),
        searchCriteria: { skill, type }
      }
    });
  } catch (error) {
    console.error('Search users by skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
};

// Get user statistics (for admin)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isBanned: false } });
    const bannedUsers = await User.count({ where: { isBanned: true } });
    const publicProfiles = await User.count({
      where: { isPublic: true, isBanned: false }
    });

    const recentUsers = await User.findAll({
      where: { isBanned: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        stats: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          public: publicProfiles
        },
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics'
    });
  }
};

// Ban/unban user (admin only)
const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;

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
        message: 'Cannot ban admin users'
      });
    }

    await user.update({ isBanned: banned });

    res.json({
      success: true,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      data: {
        user: user.getPublicProfile(),
        action: banned ? 'banned' : 'unbanned',
        reason
      }
    });
  } catch (error) {
    console.error('Toggle user ban error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user ban status'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  searchUsersBySkill,
  getUserStats,
  toggleUserBan
};
