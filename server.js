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

// 2. Serve Static Files
app.use(express.static(path.join(__dirname)));

// 3. Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'skyline-travels-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// 4. MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("Connected to MongoDB Atlas successfully"))
        .catch((err) => console.error("MongoDB connection error:", err));
}

// 5. Database Schemas & Models
const applicationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    message: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// 6. PUBLIC API ROUTES

// Get WhatsApp Number for Website Clients
app.get('/api/settings/whatsapp', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'whatsappNumber' });
        const number = setting ? setting.value : '251911000000'; // Default number
        res.json({ success: true, whatsappNumber: number });
    } catch (error) {
        res.status(500).json({ success: false, whatsappNumber: '251911000000' });
    }
});

// Submit Application
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
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. ADMIN AUTHENTICATION API ROUTES

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'በተሳካ ሁኔታ ገብተዋል' });
    } else {
        res.status(401).json({ success: false, message: 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል' });
    }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check Session
app.get('/api/admin/check-session', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
});

// Get All Applications (Protected)
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

// Update WhatsApp Number (Protected Route)
app.post('/api/admin/settings/whatsapp', async (req, res) => {
    if (!req.session || !req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    try {
        const { whatsappNumber } = req.body;
        // Clean number (remove spaces, +, or dashes)
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');

        await Settings.findOneAndUpdate(
            { key: 'whatsappNumber' },
            { value: cleanNumber },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'የ WhatsApp ስልክ ቁጥር በተሳካ ሁኔታ ተቀይሯል!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. EXPLICIT PAGE ROUTES
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}
