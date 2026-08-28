const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

let applicantsData = [];
let settingsData = { whatsapp: "251900000000" };

// Home Page Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Register Page Route (አዲሱ የምዝገባ ገጽ ራውት)
app.get(['/register', '/register.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Admin Page Route
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get Applicants API
app.get('/api/applicants', (req, res) => {
  res.json(applicantsData);
});

// Submit Application API
app.post('/api/submit', (req, res) => {
  const newApplicant = {
    id: Date.now(),
    ...req.body,
    date: new Date().toISOString()
  };
  applicantsData.push(newApplicant);
  res.json({ success: true, message: 'Application submitted successfully' });
});

// Get Settings API
app.get('/api/settings', (req, res) => {
  res.json(settingsData);
});

// Update Settings API
app.post('/api/settings', (req, res) => {
  const { whatsapp } = req.body;
  if (whatsapp) {
    settingsData.whatsapp = whatsapp;
    res.json({ success: true, message: 'Settings updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
