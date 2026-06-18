const accountModel = require('../model/account.model');
const transactionModel = require('../model/transaction.model');
const ledgerModel = require('../model/ledger.model');
const emailService = require('../services/service.nodemailer');
const userModel = require('../model/user.model');
const mongoose = require('mongoose');

async function createTransaction(req, res) {
    const { fromAccountId, toAccountId, amount , idempotencyKey} = req.body;
    
    // validate req.
    if(!fromAccountId || !toAccountId || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const fromAccount = await accountModel.findById(fromAccountId);
    const toAccount = await accountModel.findById(toAccountId);

    if(!fromAccount || !toAccount) {
        return res.status(404).json({ message: 'Account not found' });
    } 
    
    // idempotency validation
    const currTransaction = await transactionModel.findOne({ idempotencyKey: idempotencyKey });
    
    if(currTransaction) {

        if(currTransaction.status === 'PENDING') {
            return res.status(400).json({ message: 'Transaction is already in progress' });
        } else if(currTransaction.status === 'COMPLETED') {
            return res.status(400).json({ message: 'Transaction has already been completed' });
        } else if(currTransaction.status === 'FAILED') {
            return res.status(400).json({ message: 'Transaction has already failed' });
        } else if(currTransaction.status === 'REVERSED') {
            return res.status(400).json({ message: 'Transaction has already been reversed' });
        }

    }

    // account status check

    if(fromAccount.status !== 'ACTIVE' || toAccount.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'One or both accounts are not active' });
    }

    // derive sender balance
    const balance = await fromAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance in the source account' });
    }

    // create transaction - mongoDB session
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create([{
        fromAcc: fromAccountId,
        ToAcc: toAccountId,
        amount: amount,
        idempotencyKey: idempotencyKey,
        status: 'PENDING',

    }], { session });

    const debitLedger = await ledgerModel.create([{
        account: fromAccountId,
        transaction: transaction[0]._id,
        Type: 'DEBIT',
        amount: amount,
    }], { session });   

    const creditLedger = await ledgerModel.create([{
        account: toAccountId,
        transaction: transaction[0]._id,
        Type: 'CREDIT',
        amount: amount,
    }], { session });


    transaction[0].status = 'COMPLETED';
    await transaction[0].save({ session });

    await session.commitTransaction();
    session.endSession();

    // send email notification to both users
    const fromUser = await userModel.findById(fromAccount.user);
    const toUser = await userModel.findById(toAccount.user);
    
    await emailService.sendTransactionDoneEmail(
        fromUser.email,
        'Transaction Successful',
        `Hello ${fromUser.name},\n\nYour transaction of amount ${amount} from account ${fromAccountId} to account ${toAccountId} has been completed successfully.\n\nBest regards,\nThe Ledger Team`
    );

    return res.status(201).json({ message: 'Transaction completed successfully', transaction: transaction[0] });
    
    
} 


module.exports = {
    createTransaction,
}

