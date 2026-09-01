const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files (HTML, CSS, JS, Images) from the root directory
app.use(express.static(path.join(__dirname)));

const DB_FILE = path.join(__dirname, 'database.json');

// API endpoint to get all registrations
app.get('/api/registrations', (req, res) => {
  if (!fs.existsSync(DB_FILE)) {
    return res.json([]);
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// API endpoint to handle new registrations
app.post('/api/register', (req, res) => {
  let registrations = [];
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      registrations = JSON.parse(data);
    } catch (err) {
      registrations = [];
    }
  }

  const newEntry = {
    id: Date.now(),
    ...req.body,
    date: new Date().toISOString()
  };

  registrations.push(newEntry);

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(registrations, null, 2));
    res.status(201).json({ success: true, message: 'Registration saved successfully!', entry: newEntry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save registration' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
