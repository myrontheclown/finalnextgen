require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');

// Initialize Firebase Admin (Only if credentials provided)
try {
  if (fs.existsSync('./firebase-admin.json')) {
    const serviceAccount = require('./firebase-admin.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase initialized.");
  } else {
    console.warn("⚠️ firebase-admin.json not found. Firebase features will be disabled or mocked.");
  }
} catch (e) {
  console.error("Firebase init failed:", e.message);
}

const app = express();

app.use(cors());
app.use(express.json());

// Set up routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
