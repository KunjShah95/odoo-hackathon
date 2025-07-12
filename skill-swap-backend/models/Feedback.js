const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    swapId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'swaps',
            key: 'id'
        }
    },
    raterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    ratedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'feedback',
    indexes: [
        {
            fields: ['swapId']
        },
        {
            fields: ['raterId']
        },
        {
            fields: ['ratedUserId']
        },
        {
            unique: true,
            fields: ['swapId', 'raterId'] // Ensure one feedback per swap per rater
        }
    ]
});

module.exports = Feedback;
