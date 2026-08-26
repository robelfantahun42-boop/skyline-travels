const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

let applicantsData = [];
let settingsData = { whatsapp: "251900000000" };

// HTML Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'ChangeMe123!') {
    return res.json({ success: true, message: 'Logged in successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Registration API
app.post('/api/register', (req, res) => {
  try {
    const newApplicant = {
      id: Date.now().toString(),
      ...req.body,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    applicantsData.push(newApplicant);
    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving application' });
  }
});

// Get Applicants API
app.get('/api/applicants', (req, res) => {
  res.json(applicantsData);
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json(settingsData);
});

app.post('/api/settings', (req, res) => {
  settingsData = { ...settingsData, ...req.body };
  res.json({ success: true, message: 'Settings updated' });
});

module.exports = app;
