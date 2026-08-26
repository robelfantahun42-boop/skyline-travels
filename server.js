const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let memoryDB = {
  settings: { whatsapp: "251900000000" },
  applicants: []
};

// 1. Admin Page Route (አሁን admin.html በመጠቀም)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
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

// 3. User Registration Route
app.post('/api/register', (req, res) => {
  try {
    const newApplicant = {
      id: Date.now().toString(),
      ...req.body,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    memoryDB.applicants.push(newApplicant);
    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving application' });
  }
});

// 4. Get Applicants Data
app.get('/api/applicants', (req, res) => {
  res.json(memoryDB.applicants || []);
});

// 5. Get Settings
app.get('/api/settings', (req, res) => {
  res.json(memoryDB.settings || { whatsapp: "251900000000" });
});

// 6. Update Settings
app.post('/api/settings', (req, res) => {
  memoryDB.settings = { ...memoryDB.settings, ...req.body };
  res.json({ success: true, message: 'Settings updated' });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
