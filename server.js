const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 1. MongoDB Connection (Cached for Serverless / Vercel Environment)
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    if (!MONGODB_URI) {
      console.warn("MONGODB_URI environment variable is not defined!");
      return;
    }
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Ensure Database connection on every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// 2. Schemas & Models
const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: String, required: true }
});

const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  jobCategory: { type: String, default: '' },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

// 3. API Routes

// --- WhatsApp Number APIs ---
app.get('/api/settings/whatsapp', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'whatsappNumber' });
    res.status(200).json({ whatsappNumber: setting ? setting.value : '251911000000' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WhatsApp settings' });
  }
});

app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }
    await Setting.findOneAndUpdate(
      { key: 'whatsappNumber' },
      { value: whatsappNumber },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'WhatsApp number updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- Customer Registration APIs ---
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, phone, email, jobCategory, message } = req.body;
    
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, error: 'ስም እና ስልክ ቁጥር ማስገባት አስፈላጊ ነው!' });
    }

    const newApp = new Application({ fullName, phone, email, jobCategory, message });
    await newApp.save();
    
    res.status(200).json({ success: true, message: 'በስኬት ተመዝግበዋል!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Admin Applications List API ---
app.get('/api/admin/applications', async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Session Check Endpoint ---
app.get('/api/admin/check-session', (req, res) => {
  res.status(200).json({ authenticated: true });
});

// Frontend route handling
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Local Development Server Listener
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
