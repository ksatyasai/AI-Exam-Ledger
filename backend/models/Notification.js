const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    audience: { type: String, enum: ['all', 'student', 'faculty'], default: 'all' }
});

module.exports = mongoose.model('Notification', notificationSchema);
