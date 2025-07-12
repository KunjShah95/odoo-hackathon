// middleware/requireAdmin.js
const supabase = require('../utils/supabaseClient');

const requireAdmin = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error || !data?.is_admin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = requireAdmin;
