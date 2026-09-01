const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// static HTML ፋይሎችን ለማገልገል (index.html እና admin.html በ public ፎልደር ውስጥ ካሉ)
app.use(express.static(__dirname));

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skyline_travels';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Successfully Connected!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas & Models
const applicantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  originCountry: { type: String, default: 'Ethiopia' },
  targetCountry: { type: String, required: true },
  purpose: { type: String, required: true },
  specificField: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  waPhone: { type: String, default: '251911000000' }
});

const Applicant = mongoose.model('Applicant', applicantSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// --- API ROUTES ---

// 1. አዲስ አመልካች መመዝገቢያ (ከ index.html የሚላክ)
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, phone, originCountry, targetCountry, purpose, specificField } = req.body;

    if (!fullName || !email || !phone || !targetCountry || !purpose) {
      return res.status(400).json({ error: 'እባክዎን አስፈላጊዎቹን መረጃዎች በሙሉ ይሙሉ!' });
    }

    const newApplicant = new Applicant({
      fullName,
      email,
      phone,
      originCountry: originCountry || 'Ethiopia',
      targetCountry,
      purpose,
      specificField
    });

    await newApplicant.save();
    res.status(201).json({ success: true, message: 'ምዝገባዎ በስኬት ተጠናቋል!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'የሰርቨር ስህተት ተከሰቷል። እባክዎ ድጋሚ ይሞክሩ።' });
  }
});

// 2. የተመዘገቡ አመልካቾችን ዝርዝር ማምጫ (ለ admin.html)
app.get('/api/admin/applicants', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: 'መረጃዎችን ማምጣት አልተቻለም።' });
  }
});

// 3. የዋትስአፕ ቁጥር ማምጫ እና ማስተካከያ
app.get('/api/settings/whatsapp', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ waPhone: '251911000000' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Settings fetch failed' });
  }
});

app.post('/api/admin/settings/whatsapp', async (req, res) => {
  try {
    const { waPhone } = req.body;
    let settings = await Settings.findOne();
    if (settings) {
      settings.waPhone = waPhone;
      await settings.save();
    } else {
      await Settings.create({ waPhone });
    }
    res.json({ success: true, message: 'WhatsApp number updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Skyline Server is running on port ${PORT}`);
});
