const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { userId, password, role } = req.body;

    try {
        // Find user by ID and Role
        const user = await User.findOne({ userId, role });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or incorrect role' });
        }

        // Check password (plain text for this demo, NEVER do this in prod)
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Return success
        res.json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { userId, password, role, name, department } = req.body;

    try {
        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User ID already exists' });
        }

        const newUser = new User({
            userId,
            password,
            role,
            name,
            department
        });

        await newUser.save();
        res.json({ success: true, message: 'Registration successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
