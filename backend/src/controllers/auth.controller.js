const userModel = require('../model/user.model');
const jwt = require('jsonwebtoken');
const emailServices = require('../services/service.nodemailer');
const blacklistTokenModel = require('../model/blackListToken.model');

/**
 * - To Register
 * - POST /api/auth/register
 */

async function registerUser(req, res) {
    const { email, name, password } = req.body;
    const isExist = await userModel.findOne({ email: email }).select('+password');

    if (isExist) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = await userModel.create({
        email: email,
        name: name,
        password: password
    });
    
    const token = jwt.sign(
        { id: newUser._id},
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    

    res.cookie('token', token);
    res.status(201).json({ message: 'User registered successfully', user: newUser.email, token: token });

    // Send welcome email
    await emailServices.sendRegistrationEmail(
        newUser.email,
        'Welcome to Ledger',
        `Hello ${newUser.name},\n\nThank you for registering at Ledger! We're excited to have you on board.\n\nBest regards,\nThe Ledger Team`
    );
    
}

/**
 * - To Login
 * - POST /api/auth/login
 */
async function loginUser(req, res) {
    const { email, password } = req.body;
    const isExist = await userModel.findOne({ email}).select('+password');
    if(!isExist){ 
        return res.status(400).json({ message: 'User Not Registered' });
    }

    const isMatch = await isExist.comparePassword(password);
    if(!isMatch){
        return res.status(400).json({ message: 'Invalid Password' });
    }

    

    const token = jwt.sign(
        { id: isExist._id},
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
    );

    res.cookie('token', token);
    res.status(200).json({ message: 'User logged in successfully', user: {id : isExist._id, email : isExist.email, name : isExist.name }, token: token });
    
}

async function logoutUser(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(200).json({ message: 'User Already Logged Out' });
    }

    const blacklistedToken = await blacklistTokenModel.create({ token: token });
    res.clearCookie('token');
    return res.status(200).json({ message: 'User logged out successfully' });
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser
}
