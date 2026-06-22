const mongoose = require('mongoose');
const userModel = require('./user.model');

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
}, {
    timestamps: true
});

blacklistTokenSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7 days  
);

const blacklistTokenModel = mongoose.model('BlacklistToken', blacklistTokenSchema);
module.exports = blacklistTokenModel;