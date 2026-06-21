const express = require('express');
const userModel = require('../model/user.model');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.header.authorization?.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized access denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if(!user) {
            return res.status(401).json({ message: 'Unauthorized access denied' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized access denied' });
    }

}

async function authSysUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.header.authorization?.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized access denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('+systemUser');
        if(!user || user.systemUser !== true)  {
            return res.status(401).json({ message: 'Unauthorized access denied' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized access denied' });
    }

}




module.exports = {
    authMiddleware,
    authSysUserMiddleware,
}