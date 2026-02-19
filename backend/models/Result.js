const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    grade: { type: String, required: true }, // A, B, F, etc.
    marks: { type: Number, required: true },
    status: { type: String, enum: ['PASS', 'FAIL'], required: true },
    semester: { type: Number, required: true },
    revaluationStatus: {
        type: String,
        enum: ['none', 'pending', 'processing', 'completed', 'pending_approval'],
        default: 'none'
    },
    aiMarks: { type: Number, default: null },
    aiBreakdown: { type: Array, default: [] },
    revaluationPayment: { type: Boolean, default: false },
    answerScript: { type: String, default: null }
});

module.exports = mongoose.model('Result', resultSchema);
