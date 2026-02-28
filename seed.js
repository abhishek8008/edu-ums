/**
 * Seed script — creates demo Admin, Faculty & Student accounts
 * Run:  node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ums-db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    /* ── 1. Admin ─────────────────────────── */
    let admin = await User.findOne({ email: 'admin@ums.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@ums.com',
        password: 'admin123',
        role: 'Admin',
        department: 'Administration',
      });
      console.log('✅ Admin created  →  admin@ums.com / admin123');
    } else {
      console.log('⏩ Admin already exists');
    }

    /* ── 2. Faculty ───────────────────────── */
    let facultyUser = await User.findOne({ email: 'faculty@ums.com' });
    let faculty;
    if (!facultyUser) {
      facultyUser = await User.create({
        name: 'Dr. Sharma',
        email: 'faculty@ums.com',
        password: 'faculty123',
        role: 'Faculty',
        department: 'Computer Science',
      });
      faculty = await Faculty.create({
        user: facultyUser._id,
        employeeId: 'FAC001',
        department: 'Computer Science',
        qualification: 'PhD Computer Science',
        experience: 10,
      });
      console.log('✅ Faculty created →  faculty@ums.com / faculty123');
    } else {
      faculty = await Faculty.findOne({ user: facultyUser._id });
      console.log('⏩ Faculty already exists');
    }

    /* ── 3. Subject ───────────────────────── */
    let subject = await Subject.findOne({ subjectCode: 'CS101' });
    if (!subject) {
      subject = await Subject.create({
        subjectName: 'Data Structures',
        subjectCode: 'CS101',
        department: 'Computer Science',
        semester: 3,
        credits: 4,
        assignedFaculty: faculty._id,
      });
      // Add subject to faculty's teaching list
      faculty.subjectsTeaching.push(subject._id);
      await faculty.save();
      console.log('✅ Subject created →  Data Structures (CS101)');
    } else {
      console.log('⏩ Subject already exists');
    }

    /* ── 4. Student ───────────────────────── */
    let studentUser = await User.findOne({ email: 'student@ums.com' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Rahul Kumar',
        email: 'student@ums.com',
        password: 'student123',
        role: 'Student',
        department: 'Computer Science',
      });
      await Student.create({
        user: studentUser._id,
        enrollmentNumber: 'STU2024001',
        course: 'B.Tech',
        semester: 3,
        subjects: [subject._id],
        guardianDetails: {
          name: 'Mr. Kumar',
          phone: '9876543210',
        },
      });
      console.log('✅ Student created →  student@ums.com / student123');
    } else {
      console.log('⏩ Student already exists');
    }

    console.log('\n🎉 Seed complete! You can now log in with:\n');
    console.log('   Admin:   admin@ums.com   / admin123');
    console.log('   Faculty: faculty@ums.com / faculty123');
    console.log('   Student: student@ums.com / student123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
