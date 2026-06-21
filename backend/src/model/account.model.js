const mongoose = require('mongoose');
const ledgerModel = require('./ledger.model');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Account must be associated with a user'],
        index : true
    },
    status: {
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

accountSchema.index({ user: 1 , status : 1}); // compound index  
accountSchema.methods.getBalance = async function () {
    const result = await ledgerModel.aggregate([
        {
            $match: {
                account: this._id
            }
        },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ['$Type', 'CREDIT'] },
                            '$amount',
                            { $multiply: ['$amount', -1] }
                        ]
                    }
                }
            }
        }
    ]);

    return result.length ? result[0].balance : 0;
};

const accountModel = mongoose.model('Account', accountSchema);
module.exports = accountModel;

