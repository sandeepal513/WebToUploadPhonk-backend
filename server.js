require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db/database');

const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const userRoutes = require('./routes/users');
const guestRoutes = require('./routes/guests');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Enable CORS for frontend requests
app.use(
  cors({
    origin: '*', // Allow all origins for dev/production flex
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-token'],
  })
);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded files (audio & cover images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guests', guestRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PHONK HUB Backend API',
    message: '🏎️ Welcome to PHONK HUB Backend API',
    endpoints: {
      health: '/api/health',
      tracks: '/api/tracks',
      auth: '/api/auth',
      guests: '/api/guests',
    },
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'PHONK HUB Backend API (MongoDB Edition)',
    timestamp: new Date().toISOString(),
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`
  🏎️  =========================================
  🔥  PHONK HUB BACKEND SERVER IS RUNNING (MongoDB)
  📡  URL: http://localhost:${PORT}
  🎧  HEALTH: http://localhost:${PORT}/api/health
  =========================================
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`👉 Please kill any running Node process using port ${PORT} or change PORT in .env`);
  } else {
    console.error('❌ Server startup error:', err);
  }
});
