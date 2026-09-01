const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

const DB_FILE = path.join(__dirname, 'database.json');

// In-memory data store for Vercel deployment
let memoryRegistrations = [];
let siteSettings = { phone: '+251 911 000 000' };

// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- Settings API (Phone Number) ---
app.get('/api/settings', (req, res) => {
  res.json(siteSettings);
});

app.post('/api/settings', (req, res) => {
  if (req.body.phone) {
    siteSettings.phone = req.body.phone;
  }
  res.json({ success: true, settings: siteSettings });
});

// --- Registrations API ---
app.get('/api/registrations', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return res.json(JSON.parse(data));
    } catch (err) {}
  }
  res.json(memoryRegistrations);
});

app.post('/api/register', (req, res) => {
  const newEntry = {
    id: Date.now(),
    ...req.body,
    date: new Date().toISOString()
  };

  memoryRegistrations.push(newEntry);

  try {
    let currentData = memoryRegistrations;
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        currentData = JSON.parse(fileContent);
        currentData.push(newEntry);
      } catch(e) {}
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
  } catch (err) {}

  res.status(201).json({ success: true, message: 'Registration saved successfully!', entry: newEntry });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
