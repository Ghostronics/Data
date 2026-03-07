require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make db available to routes
app.locals.db = db;

// Routes
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/premarket', require('./routes/premarket'));
app.use('/api/daily-notes', require('./routes/dailyNotes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Trading Journal API running on port ${PORT}`);
});
