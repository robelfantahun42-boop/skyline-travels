const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// In-Memory Database for Vercel Serverless
let applicantsData = [];
let settingsData = { whatsapp: "251900000000" };

// 1. Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Admin Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 3. Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'ChangeMe123!') {
    return res.json({ success: true, message: 'Logged in successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// 4. Registration API
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

// 5. Get Applicants Data
app.get('/api/applicants', (req, res) => {
  res.json(applicantsData);
});

// 6. Settings API
app.get('/api/settings', (req, res) => {
  res.json(settingsData);
});

app.post('/api/settings', (req, res) => {
  settingsData = { ...settingsData, ...req.body };
  res.json({ success: true, message: 'Settings updated' });
});

module.exports = app;
