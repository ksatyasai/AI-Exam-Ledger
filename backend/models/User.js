const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Student ID (e.g., 19A8...) or Faculty ID
    password: { type: String, required: true }, // In real app, hash this!
    role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
    name: { type: String, required: true },
    email: { type: String },
    department: { type: String }
});

module.exports = mongoose.model('User', userSchema);
