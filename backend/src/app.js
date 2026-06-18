const express = require('express')
const cookieParser = require('cookie-parser')

// Routes required
const accountRoutes = require('./routes/account.routes')
const authRoutes = require('./routes/auth.routes')
const transactionRoutes = require('./routes/transaction.routes')

const app = express()
app.use(express.json())
app.use(cookieParser())


/* Use routes */
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes); 
app.use('/api/transaction', transactionRoutes);


module.exports = app;