const mongoose = require('mongoose');
const User = require('./models/User');
const Result = require('./models/Result');
const Notification = require('./models/Notification');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/examchain';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected for seeding...'))
    .catch(err => console.log(err));

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Result.deleteMany({});
        await Notification.deleteMany({});

        // Users
        const users = [
            { userId: '19A81A0501', password: 'password123', role: 'student', name: 'Satyasai', department: 'CSE' },
            { userId: '19A81A0502', password: 'password123', role: 'student', name: 'John Doe', department: 'CSE' },
            { userId: 'FAC001', password: 'admin123', role: 'faculty', name: 'Dr. Smith', department: 'CSE' }
        ];
        await User.insertMany(users);
        console.log('Users seeded');

        // Results
        const results = [
            { studentId: '19A81A0501', subjectName: 'Cryptography', subjectCode: 'CS401', grade: 'A', marks: 85, status: 'PASS', semester: 4 },
            { studentId: '19A81A0501', subjectName: 'Distributed Systems', subjectCode: 'CS402', grade: 'F', marks: 28, status: 'FAIL', semester: 4 },
            { studentId: '19A81A0501', subjectName: 'Data Mining', subjectCode: 'CS403', grade: 'B+', marks: 72, status: 'PASS', semester: 4 }
        ];
        await Result.insertMany(results);
        console.log('Results seeded');

        // Notifications
        const notifications = [
            { title: 'Exam Results Released', message: 'Semester 4 regular exam results are now available.', date: new Date('2026-01-28') },
            { title: 'Revaluation Fee Date', message: 'Last date for revaluation fee payment is Feb 15th.', date: new Date('2026-01-30') }
        ];
        await Notification.insertMany(notifications);
        console.log('Notifications seeded');

        console.log('✅ Seeding complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
