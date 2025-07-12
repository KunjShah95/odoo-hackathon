// Swap model removed. Use Supabase client queries instead.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Swap = sequelize.define('Swap', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    requesterSkill: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recipientSkill: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    scheduledDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'swaps',
    indexes: [
        {
            fields: ['requesterId']
        },
        {
            fields: ['recipientId']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Swap;
