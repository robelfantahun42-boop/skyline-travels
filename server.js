const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
let db;

async function connectDB() {
  if (!db && uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      db = client.db('skyline_travels');
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }
}
connectDB();

// Explicit Routes for Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// API Routes for Status
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', connected: !!db });
});

// Fetch all applications for Admin Panel
const getApplicationsHandler = async (req, res) => {
  try {
    await connectDB();
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const applications = await db.collection('applications').find({}).toArray();
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/applications', getApplicationsHandler);
app.get('/api/applicants', getApplicationsHandler);

// Handle Registration / Job Application Submissions
const handleApplicationSubmission = async (req, res) => {
  try {
    await connectDB();
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    
    const application = {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };
    
    const result = await db.collection('applications').insertOne(application);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/apply', handleApplicationSubmission);
app.post('/api/register', handleApplicationSubmission);

// Conditional listen for local development, export for Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
