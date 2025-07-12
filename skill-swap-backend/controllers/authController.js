const supabase = require('../utils/supabaseClient');



// Register new user with Supabase
const register = async (req, res) => {
    try {
        const { name, email, password, location, skillsOffered, skillsWanted, availability, bio } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
                error: { code: 'VALIDATION_ERROR' },
                requestId: req.id || undefined
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
                error: { code: 'VALIDATION_ERROR' },
                requestId: req.id || undefined
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
            console.error('Supabase registration error:', error);
            return res.status(400).json({
                success: false,
                message: error.message,
                error: { code: error.code, details: error.message },
                requestId: req.id || undefined
            });
        }

        // Insert user profile in Supabase users table
        const { error: insertError } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                location,
                skills_offered: skillsOffered || [],
                skills_wanted: skillsWanted || [],
                availability,
                bio,
                is_public: true
            }]);
        if (insertError) {
            console.error('Supabase user insert error:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Error creating user profile',
                error: { code: insertError.code, details: insertError.message },
                requestId: req.id || undefined
            });
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to confirm your account.',
            data: {
                email
            },
            requestId: req.id || undefined
        });
    } catch (error) {
        console.error('Registration error:', { error, path: req.path, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
            requestId: req.id || undefined
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
            console.error('Supabase login error:', error);
            return res.status(401).json({
                success: false,
                message: error.message,
                error: { code: error.code, details: error.message },
                requestId: req.id || undefined
            });
        }
        // Get user profile from Supabase users table
        const { data: userProfile, error: userProfileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (userProfileError) {
            console.error('Supabase user profile fetch error:', userProfileError);
            return res.status(500).json({
                success: false,
                message: 'Error fetching user profile',
                error: { code: userProfileError.code, details: userProfileError.message },
                requestId: req.id || undefined
            });
        }
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                access_token: data.session.access_token,
                user: userProfile
            },
            requestId: req.id || undefined
        });
    } catch (error) {
        console.error('Login error:', { error, path: req.path, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
            requestId: req.id || undefined
        });
    }
};
// (Legacy login code removed; see above for new Supabase login implementation)

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !user) {
            console.error('Supabase getProfile error:', error);
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: { code: error?.code || 'NOT_FOUND', details: error?.message },
                requestId: req.id || undefined
            });
        }
        res.json({
            success: true,
            data: { user },
            requestId: req.id || undefined
        });
    } catch (error) {
        console.error('Get profile error:', { error, path: req.path, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile',
            error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
            requestId: req.id || undefined
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
        if (skillsOffered !== undefined) updateData.skills_offered = skillsOffered;
        if (skillsWanted !== undefined) updateData.skills_wanted = skillsWanted;
        if (availability !== undefined) updateData.availability = availability;
        if (bio !== undefined) updateData.bio = bio;
        if (isPublic !== undefined) updateData.is_public = isPublic;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);
        if (error) {
            console.error('Supabase updateProfile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating profile',
                error: { code: error.code, details: error.message },
                requestId: req.id || undefined
            });
        }
        // Fetch updated user
        const { data: updatedUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (fetchError) {
            console.error('Supabase fetch updated user error:', fetchError);
            return res.status(500).json({
                success: false,
                message: 'Error fetching updated profile',
                error: { code: fetchError.code, details: fetchError.message },
                requestId: req.id || undefined
            });
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser },
            requestId: req.id || undefined
        });
    } catch (error) {
        console.error('Update profile error:', { error, path: req.path, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Server error updating profile',
            error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
            requestId: req.id || undefined
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { access_token } = req.headers;
        const { newPassword } = req.body;
        if (!access_token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Access token and new password are required',
                error: { code: 'VALIDATION_ERROR' },
                requestId: req.id || undefined
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
                error: { code: 'VALIDATION_ERROR' },
                requestId: req.id || undefined
            });
        }
        // Use Supabase admin API to update password
        const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: newPassword });
        if (error) {
            console.error('Supabase changePassword error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error changing password',
                error: { code: error.code, details: error.message },
                requestId: req.id || undefined
            });
        }
        res.json({
            success: true,
            message: 'Password changed successfully',
            requestId: req.id || undefined
        });
    } catch (error) {
        console.error('Change password error:', { error, path: req.path, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Server error changing password',
            error: { code: error.code || 'INTERNAL_ERROR', details: error.message },
            requestId: req.id || undefined
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
