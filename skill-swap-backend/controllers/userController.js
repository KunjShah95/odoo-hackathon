const supabase = require('../utils/supabaseClient');

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
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    let query = supabase.from('users').select('*', { count: 'exact' });
    // Only include public profiles unless admin
    if (!includePrivate || !req.user?.is_admin) {
      query = query.eq('is_public', true);
    }
    query = query.eq('is_banned', false);
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (skill) {
      query = query.or(`skills_offered.cs.{"${skill}"},skills_wanted.cs.{"${skill}"}`);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    query = query.range(from, to).order('created_at', { ascending: false });
    const { data: users, error, count } = await query;
    if (error) {
      console.error('Supabase getAllUsers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: { code: error.code, details: error.message },
        requestId: req.id || undefined
      });
    }
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      },
      requestId: req.id || undefined
    });
  } catch (error) {
    console.error('Get all users error:', { error, path: req.path, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
      requestId: req.id || undefined
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !user) {
      console.error('Supabase getUserById error:', error);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: error?.code || 'NOT_FOUND', details: error?.message },
        requestId: req.id || undefined
      });
    }
    if (user.is_banned) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        requestId: req.id || undefined
      });
    }
    if (!user.is_public && (!req.user || (req.user.id !== user.id && !req.user.is_admin))) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private',
        requestId: req.id || undefined
      });
    }
    res.json({
      success: true,
      data: { user },
      requestId: req.id || undefined
    });
  } catch (error) {
    console.error('Get user by ID error:', { error, path: req.path, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
      requestId: req.id || undefined
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
        message: 'Skill parameter is required',
        error: { code: 'VALIDATION_ERROR' },
        requestId: req.id || undefined
      });
    }
    const skillField = type === 'offered' ? 'skills_offered' : 'skills_wanted';
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .contains(skillField, [skill])
      .eq('is_public', true)
      .eq('is_banned', false)
      .order('rating', { ascending: false });
    if (error) {
      console.error('Supabase searchUsersBySkill error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching users',
        error: { code: error.code, details: error.message },
        requestId: req.id || undefined
      });
    }
    res.json({
      success: true,
      data: {
        users,
        searchCriteria: { skill, type }
      },
      requestId: req.id || undefined
    });
  } catch (error) {
    console.error('Search users by skill error:', { error, path: req.path, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error searching users',
      error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
      requestId: req.id || undefined
    });
  }
};

// Get user statistics (for admin)
const getUserStats = async (req, res) => {
  try {
    const { count: totalUsers, error: totalError } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: activeUsers, error: activeError } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', false);
    const { count: bannedUsers, error: bannedError } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', true);
    const { count: publicProfiles, error: publicError } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_public', true).eq('is_banned', false);
    const { data: recentUsers, error: recentError } = await supabase.from('users').select('id, name, email, created_at').eq('is_banned', false).order('created_at', { ascending: false }).limit(5);
    if (totalError || activeError || bannedError || publicError || recentError) {
      console.error('Supabase getUserStats error:', { totalError, activeError, bannedError, publicError, recentError });
      return res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
        error: { code: 'STATS_ERROR' },
        requestId: req.id || undefined
      });
    }
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
      },
      requestId: req.id || undefined
    });
  } catch (error) {
    console.error('Get user stats error:', { error, path: req.path, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics',
      error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
      requestId: req.id || undefined
    });
  }
};

// Ban/unban user (admin only)
const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;
    // Fetch user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: error?.code || 'NOT_FOUND', details: error?.message },
        requestId: req.id || undefined
      });
    }
    if (user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users',
        requestId: req.id || undefined
      });
    }
    // Update ban status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_banned: banned })
      .eq('id', id);
    if (updateError) {
      console.error('Supabase toggleUserBan error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating user ban status',
        error: { code: updateError.code, details: updateError.message },
        requestId: req.id || undefined
      });
    }
    res.json({
      success: true,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      data: {
        user: { ...user, is_banned: banned },
        action: banned ? 'banned' : 'unbanned',
        reason
      },
      requestId: req.id || undefined
    });
  } catch (error) {
    console.error('Toggle user ban error:', { error, path: req.path, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error updating user ban status',
      error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
      requestId: req.id || undefined
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
