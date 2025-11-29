const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const session = require('express-session');

/**
 * Main Server Application Entry Point.
 * Configures Express app, database connection, middleware, and routes.
 */

// Load environment variables
dotenv.config();

const app = express();
const DEFAULT_PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for full sync
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'whiz-pos-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Templating Engine
app.use(expressLayouts);
app.set('layout', './layout/main');
app.set('view engine', 'ejs');

// Database Connection
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
        // Attempt to connect to the provided URI
        try {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
            console.log(`MongoDB Connected: ${mongoUri.includes('mongodb+srv') ? 'Cloud Cluster' : 'Local Instance'}`);
        } catch (error) {
            console.warn('WARNING: Failed to connect to the provided MONGODB_URI.');
            console.warn('Error Details:', error.message);
            console.warn('Falling back to temporary in-memory database.');

            // Fallback to in-memory
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            process.env.MONGODB_URI = mongoUri; // Update env so other parts know
            await mongoose.connect(mongoUri);
            console.log('MongoDB Connected (Temporary In-Memory)');
        }
    } else {
        // Fallback to in-memory ONLY if no URI is provided
        console.warn('WARNING: No MONGODB_URI provided. Using temporary in-memory database. Data will be lost on restart.');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        process.env.MONGODB_URI = mongoUri;
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected (Temporary In-Memory)');
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};

connectDB();

// Global variables for views
app.use((req, res, next) => {
  res.locals.businessName = process.env.BUSINESS_NAME || 'WHIZ POS';
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/api', require('./routes/api'));
app.use('/', require('./routes/web'));

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (port !== parseInt(DEFAULT_PORT)) {
      console.warn(`\nWARNING: Port ${DEFAULT_PORT} was in use. Running on fallback port ${port}.`);
      console.warn(`Please update your Desktop App .env file to use VITE_BACK_OFFICE_URL=http://localhost:${port} if needed.\n`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(parseInt(DEFAULT_PORT));
