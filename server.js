const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const DB_FILE = path.join(__dirname, 'database.json');

// Helper to read DB
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { settings: { whatsapp: "251900000000" }, registrations: [] };
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { settings: { whatsapp: "251900000000" }, registrations: [] };
  }
}

// Helper to write DB
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API: Get Settings (WhatsApp number)
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || { whatsapp: "251900000000" });
});

// API: Update Settings (Admin can change WhatsApp)
app.post('/api/settings', (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) {
    return res.status(400).json({ success: false, message: 'WhatsApp number is required' });
  }
  const db = readDB();
  db.settings = { whatsapp: whatsapp.replace(/[^0-9]/g, '') };
  writeDB(db);
  res.json({ success: true, message: 'Settings updated successfully' });
});

// API: Register User
app.post('/api/register', (req, res) => {
  const { fullName, email, phone, nationality, targetCountry, category, education, message } = req.body;
  
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, message: 'Full name and phone are required' });
  }

  const db = readDB();
  if (!db.registrations) db.registrations = [];

  // Check duplicate phone
  const existing = db.registrations.find(r => r.phone === phone);
  if (existing) {
    return res.status(400).json({ success: false, message: 'This phone number is already registered!' });
  }

  const newReg = {
    id: Date.now(),
    fullName,
    email: email || '',
    phone,
    nationality: nationality || '',
    targetCountry: targetCountry || '',
    category: category || '',
    education: education || '',
    message: message || '',
    date: new Date().toISOString()
  };

  db.registrations.push(newReg);
  writeDB(db);

  res.json({ success: true, message: 'Registration successful!' });
});

// API: Get All Registrations for Admin Panel
app.get('/api/registrations', (req, res) => {
  const db = readDB();
  res.json(db.registrations || []);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
