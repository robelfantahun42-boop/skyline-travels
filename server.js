const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Files (HTML, CSS, JS, Images) FIRST from root directory
app.use(express.static(path.join(__dirname)));

// 3. Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'skyline-travels-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS if needed
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// 4. MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("Connected to MongoDB Atlas successfully"))
        .catch((err) => console.error("MongoDB connection error:", err));
} else {
    console.warn("MONGODB_URI environment variable is not defined!");
}

// 5. Database Schema & Model for Job Applications
const applicationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    message: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

// 6. PUBLIC API ROUTES

// Submit Job Application
app.post('/api/apply', async (req, res) => {
    try {
        const { fullName, email, phone, position, message } = req.body;
        if (!fullName || !email || !phone || !position) {
            return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም አስፈላጊ መስኮች ይሙሉ::' });
        }

        const newApp = new Application({ fullName, email, phone, position, message });
        await newApp.save();

        res.status(201).json({ success: true, message: 'ማመልከቻዎ በተሳካ ሁኔታ ተልኳል!' });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. ADMIN AUTHENTICATION API ROUTES

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass && username === adminUser && password === adminPass) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'በተሳካ ሁኔታ ገብተዋል' });
    } else {
        res.status(401).json({ success: false, message: 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል' });
    }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check Admin Session Status
app.get('/api/admin/check-session', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
});

// Get All Submitted Applications (Protected Route)
app.get('/api/admin/applications', async (req, res) => {
    if (!req.session || !req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    try {
        const applications = await Application.find().sort({ createdAt: -1 });
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. EXPLICIT PAGE ROUTES

// Serve Admin Page Explicitly
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all route for Main Client Page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 9. Export App for Vercel Serverless Functions
module.exports = app;

// 10. Local Server Listener
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
