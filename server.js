const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (HTML, CSS, JS) እንዲሰሩ ማድረግ
app.use(express.static(__dirname));

// Database Path Configuration
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder and database.json exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    settings: { whatsapp: "251900000000" },
    applicants: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions for Database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { settings: { whatsapp: "251900000000" }, applicants: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- ROUTES ---

// 1. Admin Page Route (በብራውዘር በቀጥታ እንዲከፍት)
app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'admin'));
});

// 2. Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'ChangeMe123!') {
    res.json({ success: true, message: 'Logged in successfully' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 3. User Registration Route (ለመመዝገቢያ ፎርሙ)
app.post('/api/register', (req, res) => {
  try {
    const db = readDB();
    const newApplicant = {
      id: Date.now().toString(),
      ...req.body,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    db.applicants.push(newApplicant);
    writeDB(db);

    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving application' });
  }
});

// 4. Get Applicants Data (ለ Admin Dashboard)
app.get('/api/applicants', (req, res) => {
  const db = readDB();
  res.json(db.applicants || []);
});

// 5. Get Settings (WhatsApp number)
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || { whatsapp: "251900000000" });
});

// 6. Update Settings
app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ success: true, message: 'Settings updated' });
});

// For Vercel Serverless Deployment
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
