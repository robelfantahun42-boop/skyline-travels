const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "YOUR_MONGODB_CONNECTION_STRING";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB Atlas successfully");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Example Application Schema & Route
const applicationSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    position: String,
    createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);

app.post('/api/apply', async (req, res) => {
    try {
        const newApp = new Application(req.body);
        await newApp.save();
        res.status(201).json({ success: true, message: 'Application submitted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Catch-all route for frontend pages
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel serverless function
module.exports = app;

// Local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
