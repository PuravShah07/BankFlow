const accountModel = require('../model/account.model');
const emailServices  = require('../services/service.nodemailer');

async function createAccount(req, res) {
    const newAccount = await accountModel.create({
        user: req.user._id,
    });

    res.status(201).json({ message: 'Account created successfully', account: newAccount });
}


module.exports = {
    createAccount,
}