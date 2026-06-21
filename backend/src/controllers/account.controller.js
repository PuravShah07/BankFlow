const accountModel = require('../model/account.model');
const emailServices  = require('../services/service.nodemailer');

async function createAccount(req, res) {
    const newAccount = await accountModel.create({
        user: req.user._id,
    });

    res.status(201).json({ message: 'Account created successfully', account: newAccount });
}


async function getMyAccounts(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({ 
        user : req.user.name,
        accounts 
    });
}

async function getBalance(req, res) {
    const accountId = req.params.accountId;
    const account = await accountModel.findById({
        _id: accountId
    });


    res.status(200).json({
        id : account._id,
        user: account.user,
        status: account.status,
        balance: await account.getBalance()
    });
}

module.exports = {
    createAccount,
    getMyAccounts,
    getBalance
}   