// Helper utilities for MySQL JSON field operations
// Use these when working with skillsOffered and skillsWanted arrays

class SkillsHelper {
    /**
     * Add a skill to user's offered or wanted skills
     * @param {Object} user - User instance
     * @param {string} skill - Skill to add
     * @param {string} type - 'offered' or 'wanted'
     */
    static addSkill(user, skill, type = 'offered') {
        const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
        const currentSkills = user[field] || [];

        if (!currentSkills.includes(skill)) {
            currentSkills.push(skill);
            user[field] = currentSkills;
        }

        return user;
    }

    /**
     * Remove a skill from user's offered or wanted skills
     * @param {Object} user - User instance
     * @param {string} skill - Skill to remove
     * @param {string} type - 'offered' or 'wanted'
     */
    static removeSkill(user, skill, type = 'offered') {
        const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
        const currentSkills = user[field] || [];

        user[field] = currentSkills.filter(s => s !== skill);

        return user;
    }

    /**
     * Check if user has a specific skill
     * @param {Object} user - User instance
     * @param {string} skill - Skill to check
     * @param {string} type - 'offered' or 'wanted'
     */
    static hasSkill(user, skill, type = 'offered') {
        const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
        const currentSkills = user[field] || [];

        return currentSkills.includes(skill);
    }

    /**
     * Get all unique skills from all users
     * @param {Array} users - Array of user instances
     * @param {string} type - 'offered', 'wanted', or 'all'
     */
    static getAllSkills(users, type = 'all') {
        const allSkills = new Set();

        users.forEach(user => {
            if (type === 'offered' || type === 'all') {
                (user.skillsOffered || []).forEach(skill => allSkills.add(skill));
            }
            if (type === 'wanted' || type === 'all') {
                (user.skillsWanted || []).forEach(skill => allSkills.add(skill));
            }
        });

        return Array.from(allSkills).sort();
    }

    /**
     * Create Sequelize where clause for skill search in MySQL JSON field
     * @param {string} skill - Skill to search for
     * @param {string} type - 'offered' or 'wanted'
     */
    static createSkillSearchClause(skill, type = 'offered') {
        const { Op } = require('sequelize');
        const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';

        // MySQL JSON search - looks for exact skill match in JSON array
        return {
            [field]: {
                [Op.like]: `%"${skill}"%`
            }
        };
    }

    /**
     * Validate skills array
     * @param {Array} skills - Array of skills to validate
     */
    static validateSkills(skills) {
        if (!Array.isArray(skills)) {
            throw new Error('Skills must be an array');
        }

        const validSkills = skills.filter(skill =>
            typeof skill === 'string' &&
            skill.trim().length > 0 &&
            skill.length <= 50
        );

        // Remove duplicates and trim
        return [...new Set(validSkills.map(skill => skill.trim()))];
    }
}

module.exports = SkillsHelper;

// Example usage:
/*
const SkillsHelper = require('./utils/skillsHelper');

// In your controller:
const user = await User.findByPk(userId);

// Add a skill
SkillsHelper.addSkill(user, 'React', 'offered');
await user.save();

// Search for users with specific skill
const whereClause = SkillsHelper.createSkillSearchClause('JavaScript', 'offered');
const users = await User.findAll({ where: whereClause });

// Validate skills from request
const validatedSkills = SkillsHelper.validateSkills(req.body.skillsOffered);
*/
