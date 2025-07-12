const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true, // null means it's a platform-wide notification
        references: {
            model: 'users',
            key: 'id'
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('swap_request', 'swap_accepted', 'swap_rejected', 'feedback_received', 'platform_update', 'system_alert'),
        defaultValue: 'system_alert'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    relatedId: {
        type: DataTypes.UUID,
        allowNull: true // ID of related entity (swap, feedback, etc.)
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    }
}, {
    timestamps: true,
    tableName: 'notifications',
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['isRead']
        }
    ]
});

module.exports = Notification;
