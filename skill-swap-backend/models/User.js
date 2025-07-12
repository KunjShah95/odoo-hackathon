const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    hashedPassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatarURL: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    skillsOffered: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    skillsWanted: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    availability: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00,
        validate: {
            min: 0,
            max: 5
        }
    },
    totalRatings: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'users'
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.hashedPassword) {
        const salt = await bcrypt.genSalt(10);
        user.hashedPassword = await bcrypt.hash(user.hashedPassword, salt);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('hashedPassword')) {
        const salt = await bcrypt.genSalt(10);
        user.hashedPassword = await bcrypt.hash(user.hashedPassword, salt);
    }
});

// Instance method to check password
User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.hashedPassword);
};

// Instance method to get public profile
User.prototype.getPublicProfile = function () {
    const { hashedPassword, isBanned, isAdmin, ...publicProfile } = this.toJSON();
    return publicProfile;
};

module.exports = User;
