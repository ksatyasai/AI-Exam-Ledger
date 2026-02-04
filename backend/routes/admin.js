const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');

// GET /api/admin/users
// Fetch all users with optional filtering
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) query.role = role;

        const users = await User.find(query).select('-password'); // Exclude password
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/admin/notifications
// Create a new notification
router.post('/notifications', async (req, res) => {
    const { title, message, audience } = req.body;
    try {
        const newNotif = new Notification({
            title,
            message,
            audience
        });
        await newNotif.save();
        res.json({ success: true, message: 'Notification released successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/admin/users/:userId
// Update user details
router.put('/users/:userId', async (req, res) => {
    try {
        const { name, email, department } = req.body;
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (department) user.department = department;

        await user.save();
        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const Result = require('../models/Result');

// GET /api/admin/reval-requests
router.get('/reval-requests', async (req, res) => {
    try {
        const requests = await Result.find({ revaluationStatus: 'pending_approval' });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/admin/approve-reval
router.post('/approve-reval', async (req, res) => {
    const { resultId, action } = req.body; // action: 'approve' | 'reject'
    try {
        const result = await Result.findById(resultId);
        if (!result) return res.status(404).json({ message: 'Result not found' });

        if (action === 'approve') {
            result.marks = result.aiMarks;
            // Recalculate Grade/Status
            result.status = result.marks >= 40 ? 'PASS' : 'FAIL';
            result.grade = result.marks >= 90 ? 'A' : result.marks >= 75 ? 'B' : result.marks >= 60 ? 'C' : result.marks >= 40 ? 'D' : 'F';
            result.revaluationStatus = 'completed';
        } else {
            result.revaluationStatus = 'completed'; // Or 'rejected' if you want a history, but user said "until it shows processing", so completed (no change) is safer default
        }

        await result.save();
        res.json({ success: true, message: `Revaluation ${action}d successfully` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/results
// Check Marks - Fetch all student results with optional filters
router.get('/results', async (req, res) => {
    try {
        const { studentId, subject } = req.query;
        let query = {};
        if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
        if (subject) query.subjectCode = { $regex: subject, $options: 'i' };

        const results = await Result.find(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/payments
// Payment History - Fetch students who paid for revaluation
router.get('/payments', async (req, res) => {
    try {
        // Find results where payment is true meaning they paid
        const payments = await Result.find({ revaluationPayment: true });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
