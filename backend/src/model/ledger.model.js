const mongoose = require('mongoose');

const LedgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Ledger entry must be associated with an account'],
        index: true,
        immutable: true // entry can't be modified.
    },
    amount: {
        type: Number,
        required: [true, 'Ledger entry must have an amount'],
        immutable: true
    },
    transaction : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Ledger entry must be associated with a transaction'],
        index: true,
        immutable: true,
    },
    Type : {
        type: String,
        enum: {
            values: ['CREDIT', 'DEBIT'],
            message : "Ledger entry type must be either 'CREDIT' or 'DEBIT'",
        },
        immutable: true,
    }

})

function preventMod() {
    throw new Error('Ledger entry cannot be modified');
}


LedgerSchema.pre('findOneAndUpdate', preventMod);
LedgerSchema.pre('updateOne', preventMod);
LedgerSchema.pre('updateMany', preventMod);
LedgerSchema.pre('update', preventMod);
LedgerSchema.pre('deleteOne', preventMod);
LedgerSchema.pre('deleteMany', preventMod);
LedgerSchema.pre('remove', preventMod);
LedgerSchema.pre('findOneAndDelete', preventMod);
LedgerSchema.pre('findOneAndRemove', preventMod);
LedgerSchema.pre('replaceOne', preventMod);


const LedgerModel = mongoose.model('Ledger', LedgerSchema);
module.exports = LedgerModel;

