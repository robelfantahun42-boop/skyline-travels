const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection with Serverless Optimization
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('CRITICAL: MONGODB_URI is missing in environment variables.');
  }
  
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected Successfully.');
  } catch (err) {
    console.error('MongoDB Connection Failed:', err);
    throw err;
  }
}

// Schemas - Flexible and Robust
const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  targetCountry: { type: String, required: true },
  category: { type: String, required: true },
  education: { type: String, required: true },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  whatsapp: { type: String },
  telegram: { type: String }
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// API Routes for Registrations
app.post('/api/register', async (req, res) => {
  try {
    await connectDB();
    
    console.log('Incoming Registration Payload:', req.body);

    const { fullName, email, phone, nationality, targetCountry, category, education, message } = req.body;

    if (!fullName || !email || !phone || !nationality || !targetCountry || !category || !education) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please fill in all required fields.' 
      });
    }

    const newApp = new Application({
      fullName,
      email,
      phone,
      nationality,
      targetCountry,
      category,
      education,
      message: message || ''
    });

    await newApp.save();
    return res.status(200).json({ success: true, message: 'Application submitted successfully!' });
  } catch (err) {
    console.error('Registration Execution Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Database error: ' + err.message 
    });
  }
});

app.get('/api/admin/applications', async (req, res) => {
  try {
    await connectDB();
    const apps = await Application.find({}).sort({ createdAt: -1 });
    return res.json(apps);
  } catch (err) {
    console.error('Fetch Apps Error:', err);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    await connectDB();
    const setting = await Settings.findOne({ key: 'site_settings' });
    return res.json({
      whatsapp: setting ? setting.whatsapp : '',
      telegram: setting ? setting.telegram : ''
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    await connectDB();
    const { whatsappNumber } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'site_settings' },
      { whatsapp: whatsappNumber },
      { upsert: true, new: true }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update WhatsApp' });
  }
});

app.post('/api/admin/settings/telegram', async (req, res) => {
  try {
    await connectDB();
    const { telegramUsername } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'site_settings' },
      { telegram: telegramUsername },
      { upsert: true, new: true }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update Telegram' });
  }
});

// Frontend Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Local Development Port
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

module.exports = app;
