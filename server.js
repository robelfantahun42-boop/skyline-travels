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

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', connected: !!db });
});

// Job Application Endpoint
app.post('/api/apply', async (req, res) => {
  try {
    await connectDB();
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const application = req.body;
    const result = await db.collection('applications').insertOne(application);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conditional listen for local development, export for Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
