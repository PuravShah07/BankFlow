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


accountSchema.methods.getBalance = async function() {
    // MongoDB aggregation pipeline..
    const result = await ledgerModel.aggregate([
        {
            $match: { account: this._id },
        },
        {
            $group: {
                // CREDIT, DEBIT
                _id: null,
                totalSent: { $sum: { $cond: [{ $eq: ['$fromAcc', this._id] }, '$amount', 0] } },
                totalReceived: { $sum: { $cond: [{ $eq: ['$ToAcc', this._id] }, '$amount', 0] } },
                
            },
        },
        {
            $project: {
                _id: 0,
                totalBalance: { $subtract: ['$totalReceived', '$totalSent'] },

            },
        },
    ]);

    if (result.length > 0) {
        return result[0].totalBalance;
    } else { // it will return empty array , when no trans found
        return 0; 
    }
}


const accountModel = mongoose.model('Account', accountSchema);
module.exports = accountModel;

