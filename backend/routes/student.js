const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// GET /api/student/results/:studentId
router.get('/results/:studentId', async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.params.studentId });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ audience: { $in: ['all', 'student'] } }).sort({ date: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/student/reval
router.post('/reval', async (req, res) => {
    const { studentId, subjectCode, type } = req.body;
    console.log(`Reval requested for ${studentId} - ${subjectCode}`);

    try {
        const result = await Result.findOne({ studentId, subjectCode });
        if (!result) return res.status(404).json({ message: 'Result not found' });

        if (!result.answerScript) {
            return res.status(400).json({ message: 'No answer script found for this subject. Cannot proceed with AI Revaluation.' });
        }

        // Verify file exists
        const absolutePdfPath = path.join(__dirname, '..', result.answerScript);
        if (!fs.existsSync(absolutePdfPath)) {
            return res.status(404).json({ message: 'Answer script file is missing on server.' });
        }

        result.revaluationStatus = 'processing';
        result.revaluationPayment = true;
        await result.save();

        // Call Python Script
        const scriptPath = path.join(__dirname, '..', 'scripts', 'ai_reval.py');
        const pythonProcess = spawn('python', [scriptPath, absolutePdfPath, result.marks]);

        let dataString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', async (code) => {
            console.log(`Python script exited with code ${code}`);

            try {
                // Parse JSON output from Python
                const aiResult = JSON.parse(dataString);

                if (aiResult.success) {
                    // Update Record - Set as Pending Approval
                    result.aiMarks = aiResult.new_marks;
                    // We don't update official marks yet
                    result.revaluationStatus = 'pending_approval';

                    await result.save();
                    res.json({
                        success: true,
                        message: 'AI Revaluation Completed. Sent for Admin Approval.',
                        data: aiResult
                    });
                } else {
                    res.status(500).json({ message: 'AI Revaluation Failed internally.', error: aiResult });
                }

            } catch (parseError) {
                console.error("Failed to parse Python output:", dataString);
                res.status(500).json({ message: 'Error parsing AI response', internal: parseError.message });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
