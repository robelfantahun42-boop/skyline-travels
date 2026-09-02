const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING_HERE';

let cachedDb = null;
async function connectDB() {
  if (cachedDb) return cachedDb;
  try {
    const opts = { bufferCommands: false, serverSelectionTimeoutMS: 5000 };
    const conn = await mongoose.connect(MONGODB_URI, opts);
    cachedDb = conn;
    console.log('MongoDB Connected Successfully');
    return conn;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    throw err;
  }
}

// Schemas
const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  targetCountry: { type: String, required: true },
  category: { type: String, required: true },
  education: { type: String, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  whatsappNumber: { type: String }
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    await connectDB();
    const newApp = new Application(req.body);
    await newApp.save();
    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

app.get('/api/admin/applications', async (req, res) => {
  try {
    await connectDB();
    const apps = await Application.find({}).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error('Fetch Apps Error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

app.get('/api/settings/whatsapp', async (req, res) => {
  try {
    await connectDB();
    const setting = await Settings.findOne({ key: 'site_settings' });
    res.json({ whatsappNumber: setting ? setting.whatsappNumber : '251900000000' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    await connectDB();
    const { whatsappNumber } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'site_settings' },
      { whatsappNumber },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'WhatsApp updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update WhatsApp' });
  }
});

// Frontend Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
