const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connect to MongoDB (skip if running automated tests with mocks)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/v1', reportRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'CivicConnect MERN Stack Baseline Operational' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CivicConnect MERN] Server listening on port ${PORT}`);
  });
}

module.exports = app;