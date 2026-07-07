const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

// Routes required
const accountRoutes = require('./routes/account.routes')
const authRoutes = require('./routes/auth.routes')
const transactionRoutes = require('./routes/transaction.routes')

const app = express()

// CORS — allow frontend (Vite dev server) to call the API
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(cookieParser())


/* Use routes */
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes); 
app.use('/api/transaction', transactionRoutes);


module.exports = app;