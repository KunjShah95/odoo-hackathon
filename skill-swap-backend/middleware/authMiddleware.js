const supabase = require('../utils/supabaseClient');
const { User } = require('../models');

// Supabase session verification
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Validate token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Optionally, sync with local User DB
        let localUser = await User.findOne({ where: { email: user.email } });
        if (!localUser) {
            // Optionally, auto-create user in local DB
            localUser = await User.create({
                name: user.user_metadata?.name || user.email,
                email: user.email,
                hashedPassword: '',
                isPublic: true
            });
        }
        if (localUser.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Account has been banned'
            });
        }
        req.user = localUser;
        next();
    } catch (error) {
        console.error('Supabase auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during admin check'
        });
    }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                let localUser = await User.findOne({ where: { email: user.email } });
                if (!localUser) {
                    localUser = await User.create({
                        name: user.user_metadata?.name || user.email,
                        email: user.email,
                        hashedPassword: '',
                        isPublic: true
                    });
                }
                if (!localUser.isBanned) {
                    req.user = localUser;
                }
            }
        }
        next();
    } catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth
};
