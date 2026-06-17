const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAcc : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Account',
        required: [true, 'Transaction must be associated with a source account'],
        index : true
    },
    ToAcc : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Account',
        required: [true, 'Transaction must be associated with a destination account'],
        index : true
    },
    status : {
        type : String,
        enum : {
            values : ['pending', 'completed', 'failed', 'reversed'],
            message : "Transaction status must be either 'pending', 'completed', 'failed', or 'reversed'",
        },
        default : 'pending',
    },
    amount : {
        type : Number,
        required: [true, 'Transaction must have an amount'],
        min : [0, 'Transaction amount must be greater than 0'],
    },
    idempotencyKey : { // generated client side..
        type : String,
        required: [true, 'Transaction must have an idempotency key'],
        index : true,
        unique : true,
    },

} , {
    timestamps: true,
})

const transactionModel = mongoose.model('Transaction', transactionSchema);
module.exports = transactionModel;


