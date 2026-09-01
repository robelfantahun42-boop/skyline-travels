const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB connection setup (Optimized for Vercel Serverless)
const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside Vercel');
  }
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db('skyline_travels');
  return cachedDb;
}

// Explicit Routes for Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));

// API Status Route
app.get('/api/status', async (req, res) => {
  try {
    const database = await connectDB();
    res.json({ status: 'Server is running', connected: !!database });
  } catch (err) {
    res.json({ status: 'Server is running', connected: false, error: err.message });
  }
});

// Fetch all applications for Admin Panel (Handling all possible path variations)
const getApplicationsHandler = async (req, res) => {
  try {
    const database = await connectDB();
    const applications = await database.collection('applications').find({}).toArray();
    res.json(applications);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/applications', getApplicationsHandler);
app.get('/api/applicants', getApplicationsHandler);
app.get('/api/admin/applications', getApplicationsHandler);
app.get('/api/admin/applicants', getApplicationsHandler);

// Handle Registration / Job Application Submissions
const handleApplicationSubmission = async (req, res) => {
  try {
    const database = await connectDB();
    const application = {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };
    const result = await database.collection('applications').insertOne(application);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('Submission error:', err);
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
