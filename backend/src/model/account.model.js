const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Account must be associated with a user']
    },
    accountStatus: {
        type: String,
        enum: {
            values: ['ACTIVE', 'FREEZE', 'CLOSED'],
            message : "Account status must be either 'ACTIVE', 'FREEZE', or 'CLOSED'",
        },
        default: 'ACTIVE',
    },
    currency : {
        type: String,
        default: 'INR',
    }
},{
    timestamps: true,
})   

const accountModel = mongoose.model('Account', accountSchema);
module.exports = accountModel;

