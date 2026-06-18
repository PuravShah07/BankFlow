const  transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Fix error below

const { Router } = require('express');

const router = Router();


router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);



module.exports = router;
