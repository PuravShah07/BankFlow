const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();


/* POST /api/auth/register */
router.post('/register', authController.registerUser);

/* POST /api/auth/login */
router.post('/login', authController.loginUser);

/* POST /api/auth/logout */
router.post('/logout', authController.logoutUser);





router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;