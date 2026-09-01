const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB Atlas successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// 1. Applicant Schema & Model
const applicantSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    origin: { type: String, required: true },
    target: { type: String, required: true },
    purpose: { type: String, required: true },
    field: { type: String },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const Applicant = mongoose.model('Applicant', applicantSchema);

// 2. WhatsApp Setting Schema & Model
const whatsappSettingSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, default: '+251911000000' }
});

const WhatsAppSetting = mongoose.model('WhatsAppSetting', whatsappSettingSchema);

// API Routes

// Submit application registration
app.post('/api/register', async (req, res) => {
    try {
        const newApplicant = new Applicant(req.body);
        await newApplicant.save();
        res.status(201).json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Get all applicants for the Admin panel
app.get('/api/applicants', async (req, res) => {
    try {
        const applicants = await Applicant.find().sort({ _id: -1 });
        res.json(applicants);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get the current WhatsApp number for frontend display
app.get('/api/whatsapp-number', async (req, res) => {
    try {
        let setting = await WhatsAppSetting.findOne();
        if (!setting) {
            setting = new WhatsAppSetting({ phoneNumber: '+251911000000' });
            await setting.save();
        }
        res.json({ phoneNumber: setting.phoneNumber });
    } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update the WhatsApp number from the Admin panel settings
app.post('/api/whatsapp-number', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        let setting = await WhatsAppSetting.findOne();
        if (setting) {
            setting.phoneNumber = phoneNumber;
            await setting.save();
        } else {
            setting = new WhatsAppSetting({ phoneNumber });
            await setting.save();
        }

        res.json({ success: true, message: 'WhatsApp Hotline updated successfully!' });
    } catch (error) {
        console.error('Error updating WhatsApp number:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
