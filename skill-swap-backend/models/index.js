const User = require('./User');
const Swap = require('./Swap');
const Feedback = require('./Feedback');
const Notification = require('./Notification');

// Define associations
User.hasMany(Swap, { as: 'requestedSwaps', foreignKey: 'requesterId' });
User.hasMany(Swap, { as: 'receivedSwaps', foreignKey: 'recipientId' });

Swap.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });
Swap.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });

User.hasMany(Feedback, { as: 'givenFeedback', foreignKey: 'raterId' });
User.hasMany(Feedback, { as: 'receivedFeedback', foreignKey: 'ratedUserId' });

Feedback.belongsTo(User, { as: 'rater', foreignKey: 'raterId' });
Feedback.belongsTo(User, { as: 'ratedUser', foreignKey: 'ratedUserId' });
Feedback.belongsTo(Swap, { foreignKey: 'swapId' });

Swap.hasMany(Feedback, { foreignKey: 'swapId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Swap,
    Feedback,
    Notification
};
