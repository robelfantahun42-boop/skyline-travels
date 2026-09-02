const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    if (!MONGODB_URI) return;
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: String, required: true }
});

// ከ register.html ጋር የተስተካከለ ስኪማ
const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  nationality: { type: String, default: '' },      // ከ nationality ጋር ተመሳስሏል
  targetCountry: { type: String, default: '' },
  category: { type: String, default: '' },         // ከ jobCategory ይልቅ category ሆነዋል
  education: { type: String, default: '' },        // የትምህርት ደረጃ ተጨምሯል
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

// WhatsApp & Telegram APIs
app.get('/api/settings/whatsapp', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'whatsappNumber' });
    res.status(200).json({ whatsappNumber: setting ? setting.value : '251911000000' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    await Setting.findOneAndUpdate({ key: 'whatsappNumber' }, { value: whatsappNumber }, { upsert: true, new: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.get('/api/settings/telegram', async (req, res) => {
  try {
    const setting = await Setting.findOne({ $or: [{ key: 'telegramUsername' }, { key: 'telegram' }] });
    res.status(200).json({ telegramUsername: setting ? setting.value : '' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/admin/settings/telegram', async (req, res) => {
  try {
    const { telegramUsername } = req.body;
    const val = telegramUsername || '';
    await Setting.findOneAndUpdate({ key: 'telegramUsername' }, { value: val }, { upsert: true, new: true });
    await Setting.findOneAndUpdate({ key: 'telegram' }, { value: val }, { upsert: true, new: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const waSetting = await Setting.findOne({ key: 'whatsappNumber' });
    const tgSetting = await Setting.findOne({ $or: [{ key: 'telegramUsername' }, { key: 'telegram' }] });
    res.status(200).json({
      whatsapp: waSetting ? waSetting.value : '',
      telegram: tgSetting ? tgSetting.value : ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// --- Customer Registration API ---
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, phone, nationality, targetCountry, category, education, message } = req.body;
    
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, error: 'ስም እና ስልክ ቁጥር ማስገባት አስፈላጊ ነው!' });
    }

    const newApp = new Application({ 
      fullName, 
      email, 
      phone, 
      nationality, 
      targetCountry, 
      category, 
      education, 
      message 
    });
    await newApp.save();
    
    res.status(200).json({ success: true, message: 'በስኬት ተመዝግበዋል!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/applications', async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/check-session', (req, res) => {
  res.status(200).json({ authenticated: true });
});

app.post('/api/logout', (req, res) => {
  res.status(200).json({ success: true });
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
