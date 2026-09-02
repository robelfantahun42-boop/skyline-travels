const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_ATLAS_CONNECTION_STRING';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
}

// Schemas & Models
const registrationSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  nationality: String,
  targetCountry: String,
  category: String,
  education: String,
  message: String,
  date: { type: String, default: () => new Date().toLocaleDateString() }
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site_settings' },
  whatsapp: { type: String, default: '+251911000000' },
  telegram: { type: String, default: '' }
});

const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// API Routes - Registration
app.post('/api/register', async (req, res) => {
  try {
    await connectDB();
    const { fullName, email, phone, nationality, targetCountry, category, education, message } = req.body;
    
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, error: 'Full name and phone are required' });
    }

    const newReg = new Registration({
      fullName,
      email,
      phone,
      nationality,
      targetCountry,
      category,
      education,
      message
    });

    await newReg.save();
    return res.json({ success: true, message: 'Registration saved successfully' });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// API Routes - Fetch Registrations for Admin
app.get('/api/registrations', async (req, res) => {
  try {
    await connectDB();
    const registrations = await Registration.find().sort({ _id: -1 });
    return res.json(registrations);
  } catch (err) {
    console.error('Fetch Registrations Error:', err);
    return res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// API Routes - Get Site Settings
app.get('/api/settings', async (req, res) => {
  try {
    await connectDB();
    let settings = await Settings.findOne({ key: 'site_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'site_settings', whatsapp: '+251911000000', telegram: '' });
    }
    return res.json(settings);
  } catch (err) {
    console.error('Fetch Settings Error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// API Routes - Update WhatsApp
app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    await connectDB();
    const whatsappValue = req.body.whatsappNumber || req.body.whatsapp;
    
    await Settings.findOneAndUpdate(
      { key: 'site_settings' },
      { whatsapp: whatsappValue },
      { upsert: { key: 'site_settings' }, new: true }
    );
    return res.json({ success: true, message: 'WhatsApp updated successfully' });
  } catch (err) {
    console.error('Update WhatsApp Error:', err);
    return res.status(500).json({ error: 'Failed to update WhatsApp' });
  }
});

// API Routes - Update Telegram
app.post('/api/admin/settings/telegram', async (req, res) => {
  try {
    await connectDB();
    const telegramValue = req.body.telegramUsername || req.body.telegram;
    
    await Settings.findOneAndUpdate(
      { key: 'site_settings' },
      { telegram: telegramValue },
      { upsert: { key: 'site_settings' }, new: true }
    );
    return res.json({ success: true, message: 'Telegram updated successfully' });
  } catch (err) {
    console.error('Update Telegram Error:', err);
    return res.status(500).json({ error: 'Failed to update Telegram' });
  }
});

// Catch-all route to serve index.html and prevent "Cannot GET /"
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
