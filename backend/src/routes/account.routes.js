const express = require('express');
const accountController = require('../controllers/account.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

/**
 * - POST /api/account/create
 * - Create New Account 
 */

router.post('/create', authMiddleware.authMiddleware, accountController.createAccount);

module.exports = router;
