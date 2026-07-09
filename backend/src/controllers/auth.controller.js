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


async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User Not Registered' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await emailServices.sendOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP sent to your email successfully' });
}

async function resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 10) {
        return res.status(400).json({ message: 'Password must be at least 10 characters long' });
    }
    const user = await userModel.findOne({ email }).select('+resetOtp +resetOtpExpires');
    if (!user) {
        return res.status(404).json({ message: 'User Not Registered' });
    }
    if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
}

async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 10) {
        return res.status(400).json({ message: 'Password must be at least 10 characters long' });
    }
    const user = await userModel.findById(req.user._id).select('+password');
    if (!user) {
        return res.status(404).json({ message: 'User Not Registered' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect Current Password' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword
}
