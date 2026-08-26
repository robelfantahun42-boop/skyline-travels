const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ፎልደሮች
const publicPath = path.join(__dirname, 'public');
const adminPath = path.join(__dirname, 'admin');
const uploadsPath = path.join(__dirname, 'uploads');
const dbFile = path.join(__dirname, 'database.json');

if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

app.use(express.static(publicPath));
app.use('/admin', express.static(adminPath));
app.use('/uploads', express.static(uploadsPath));

// Multer ለፋይል አፕሎድ
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsPath),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Database Functions
function getDb() {
    if (!fs.existsSync(dbFile)) {
        const initial = { settings: { whatsapp_number: '+251911000000', phone: '+251911000000' }, applicants: [] };
        fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function saveDb(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/settings', (req, res) => res.json(getDb().settings));
app.get('/api/public/settings', (req, res) => res.json(getDb().settings)); // ለ Frontend ተስማሚ እንዲሆን

app.post('/api/settings', (req, res) => {
    const db = getDb();
    db.settings = { whatsapp_number: req.body.whatsapp_number, phone: req.body.phone };
    saveDb(db);
    res.json({ success: true });
});

app.get('/api/applicants', (req, res) => res.json(getDb().applicants || []));

// ፎርሙ ከሚልክባቸው የፋይል ስሞች (passportPhoto እና resume) ጋር የተስተካከለ
app.post('/api/register', upload.fields([{ name: 'passportPhoto', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), (req, res) => {
    const db = getDb();
    const newApplicant = {
        id: Date.now(),
        full_name: req.body.fullName || 'N/A',
        email: req.body.email || 'N/A',
        phone: req.body.phone || 'N/A',
        current_country: req.body.currentCountry || 'N/A',
        preferred_destination: req.body.destination || 'N/A',
        job_sector: req.body.jobSector || 'N/A',
        experience: req.body.experience || 'N/A',
        education: req.body.education || 'N/A',
        notes: req.body.notes || '',
        passport_photo: req.files && req.files.passportPhoto ? req.files.passportPhoto[0].filename : null,
        resume: req.files && req.files.resume ? req.files.resume[0].filename : null,
        created_at: new Date().toISOString()
    };
    db.applicants.unshift(newApplicant);
    saveDb(db);
    res.json({ success: true, message: 'Saved successfully' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));