const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/examchain';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully to examchain'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authIds');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', require('./routes/admin'));

// Base Route
app.get('/', (req, res) => {
    res.send('ExamChain API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
