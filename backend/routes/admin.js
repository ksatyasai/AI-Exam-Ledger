const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Result = require('../models/Result');
const Chief = require('../models/Chief');
const Notification = require('../models/Notification');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

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

// GET /api/admin/chief-list - Get all available chief examiners
router.get('/chief-list', async (req, res) => {
    try {
        const chiefs = await User.find({ role: 'chief' }).select('-password');
        res.json({
            success: true,
            count: chiefs.length,
            data: chiefs
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/assign-chief - Assign a chief examiner to a revaluation
// PROTECTED: Requires JWT token and admin role
router.post('/assign-chief', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { resultId, chiefId } = req.body;

        if (!resultId || !chiefId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: resultId, chiefId'
            });
        }

        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        const chief = await User.findOne({ userId: chiefId, role: 'chief' });
        if (!chief) {
            return res.status(404).json({ success: false, message: 'Chief not found' });
        }

        // Assign chief and update status
        result.assignedChief = chiefId;
        result.revaluationStatus = 'pending_chief'; // Waiting for Chief's review
        await result.save();

        // Notify chief
        const notif = new Notification({
            audience: [chiefId],
            title: 'New Revaluation Assignment',
            message: `You have been assigned to review revaluation for ${result.studentId} - ${result.subjectCode}`,
            type: 'chief_assignment',
            relatedId: result._id,
            date: new Date()
        });
        await notif.save();

        res.json({
            success: true,
            message: 'Chief assigned successfully. Notification sent.',
            data: result
        });
    } catch (err) {
        console.error('Error assigning chief:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/admin/reval-pending-chief - Get revaluations waiting for chief review
router.get('/reval-pending-chief', async (req, res) => {
    try {
        const requests = await Result.find({ revaluationStatus: 'pending_chief' });
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/admin/reval-requests (UPDATED) - Get revaluations waiting for admin approval (chief-submitted)
router.get('/reval-requests', async (req, res) => {
    try {
        // Get requests that are pending_approval (Chief has submitted marks)
        // For admin to review: AI marks vs Chief marks
        const requests = await Result.find({ revaluationStatus: 'pending_approval' });
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/approve-chief-marks - Admin approves Chief-submitted marks
// PROTECTED: Requires JWT token and admin role
router.post('/approve-chief-marks', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { resultId, adminId, approve } = req.body; // approve: true/false

        if (!resultId || adminId === undefined || approve === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: resultId, adminId, approve'
            });
        }

        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        if (result.revaluationStatus !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'This result is not pending admin approval'
            });
        }

        if (approve) {
            // Approve Chief's marks (NOT AI marks)
            result.finalMarks = result.chiefMarks;
            result.marks = result.chiefMarks; // Update original marks field
            result.status = result.chiefMarks >= 40 ? 'PASS' : 'FAIL';
            result.grade = result.chiefMarks >= 90 ? 'A' : result.chiefMarks >= 75 ? 'B' : result.chiefMarks >= 60 ? 'C' : result.chiefMarks >= 40 ? 'D' : 'F';
            result.revaluationStatus = 'approved';
        } else {
            // Reject: goes back to pending or rejected state
            result.revaluationStatus = 'rejected';
        }

        result.approvedBy = adminId;
        result.approvedAt = new Date();
        await result.save();

        // Notify student
        const notif = new Notification({
            audience: ['student', result.studentId],
            title: `Revaluation ${approve ? 'Approved' : 'Rejected'}`,
            message: `Your revaluation for ${result.subjectCode} has been ${approve ? 'approved' : 'rejected'}. ${approve ? `Final marks: ${result.finalMarks}` : ''}`,
            type: 'revaluation_result',
            relatedId: result._id,
            date: new Date()
        });
        await notif.save();

        res.json({
            success: true,
            message: `Revaluation ${approve ? 'approved' : 'rejected'} successfully`,
            data: result
        });

    } catch (err) {
        console.error('Error approving chief marks:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/approve-reval (OLDER ENDPOINT - NOW DEPRECATED, kept for backward compat)
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
            result.revaluationStatus = 'completed';
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

// GET /api/admin/results - Get all student results with optional filtering
router.get('/results', async (req, res) => {
    try {
        const { studentId, subject } = req.query;
        let query = {};

        if (studentId && studentId.trim()) {
            query.studentId = studentId.trim();
        }
        if (subject && subject.trim()) {
            query.subjectCode = subject.trim().toUpperCase();
        }

        const results = await Result.find(query).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        console.error('Error fetching results:', err);
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
