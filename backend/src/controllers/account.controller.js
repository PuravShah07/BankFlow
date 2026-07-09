const accountModel = require('../model/account.model');
const userModel = require('../model/user.model');
const emailServices  = require('../services/service.nodemailer');
const ledgerModel = require('../model/ledger.model');

async function createAccount(req, res) {
    const { name, currency } = req.body;
    const newAccount = await accountModel.create({
        user: req.user._id,
        name: name || 'Primary Account',
        currency: currency || 'INR'
    });

    res.status(201).json({ message: 'Account created successfully', account: newAccount });
}


// get user accounts
async function getMyAccounts(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });
    
    const accountsWithBalance = await Promise.all(
        accounts.map(async (account) => {
            const balance = await account.getBalance();
            return {
                ...account.toObject(),
                balance
            };
        })
    );

    res.status(200).json({ 
        user : req.user.name,
        accounts: accountsWithBalance 
    });
}

async function getBalance(req, res) {
    const accountId = req.params.accountId;
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if(!account) {
        return res.status(404).json({ message: 'You Don\'t Have Access To This Account' });
    }


    res.status(200).json({
        id : account._id,
        user: account.user,
        status: account.status,
        balance: await account.getBalance()
    });
}

async function getStatement(req, res) {
    const accountId = req.params.accountId;
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if(!account) {
        return res.status(404).json({ message: 'You Don\'t Have Access To This Account' });
    }

    const statement = await ledgerModel.find({ account: accountId })
        .populate({
            path: 'transaction',
            populate: [
                {
                    path: 'fromAcc',
                    populate: { path: 'user', select: 'name email' }
                },
                {
                    path: 'ToAcc',
                    populate: { path: 'user', select: 'name email' }
                }
            ]
        });

    const formattedStatement = statement.map(entry => {
        let receiverName = '';
        let description = '';
        if (entry.transaction) {
            const isDebit = entry.Type === 'DEBIT';
            const targetAcc = isDebit ? entry.transaction.ToAcc : entry.transaction.fromAcc;
            receiverName = targetAcc?.user?.name || 'N/A';
            description = isDebit
                ? `Transfer to ${targetAcc?.user?.name || 'Unknown'} (${targetAcc?.name || 'N/A'})`
                : `Transfer from ${targetAcc?.user?.name || 'Unknown'} (${targetAcc?.name || 'N/A'})`;
        }
        return {
            _id: entry._id,
            amount: entry.amount,
            type: entry.Type,
            transaction: entry.transaction,
            date: entry.transaction ? entry.transaction.createdAt : null,
            receiverName,
            description
        };
    });

    formattedStatement.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    res.status(200).json({
        accountId,
        statement: formattedStatement
    });
}

module.exports = {
    createAccount,
    getMyAccounts,
    getBalance,
    getStatement
}   