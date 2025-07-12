const supabase = require('../utils/supabaseClient');
const { User } = require('../models');
const { Op } = require('sequelize');



// Register new user with Supabase
const register = async (req, res) => {
    try {
        const { name, email, password, location, skillsOffered, skillsWanted, availability, bio } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Register user in Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Sync with local DB
        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                name,
                email,
                hashedPassword: '',
                location,
                skillsOffered: skillsOffered || [],
                skillsWanted: skillsWanted || [],
                availability,
                bio
            });
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to confirm your account.',
            data: {
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login user with Supabase
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
        // Sync with local DB
        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                name: data.user.user_metadata?.name || email,
                email,
                hashedPassword: '',
                isPublic: true
            });
        }
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                access_token: data.session.access_token,
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};
// (Legacy login code removed; see above for new Supabase login implementation)

// Get current user profile
const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, location, skillsOffered, skillsWanted, availability, bio, isPublic } = req.body;
        const userId = req.user.id;

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (location !== undefined) updateData.location = location;
        if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
        if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
        if (availability !== undefined) updateData.availability = availability;
        if (bio !== undefined) updateData.bio = bio;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        await User.update(updateData, { where: { id: userId } });

        const updatedUser = await User.findByPk(userId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Verify current password
        const isValidPassword = await req.user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await User.update(
            { hashedPassword: newPassword },
            { where: { id: userId }, individualHooks: true }
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing password'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
