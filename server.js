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
app.set('views', path.join(__dirname, 'views'));
app.set('layout', './layout/main');
app.set('view engine', 'ejs');

// Global variables for views
app.use((req, res, next) => {
  res.locals.businessName = process.env.BUSINESS_NAME || 'WHIZ POS';
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  // Add a flag to views to know if DB is missing
  res.locals.dbMissing = !mongoose.connection.readyState && process.env.VERCEL;
  next();
});

// Database Connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, return
  if (cached.conn) {
    return cached.conn;
  }

  let mongoUri = process.env.MONGODB_URI;

  // Vercel Environment Check
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

  if (!mongoUri && isVercel) {
    console.warn('WARNING: Running on Vercel without MONGODB_URI. Database features will be disabled.');
    return null;
  }

  if (mongoUri) {
    try {
      if (!cached.promise) {
        const opts = {
          bufferCommands: false, // Disable buffering
          serverSelectionTimeoutMS: 5000
        };
        cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
          console.log(`MongoDB Connected: ${mongoUri.includes('mongodb+srv') ? 'Cloud Cluster' : 'Local Instance'}`);
          return mongoose;
        });
      }
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
       console.error('MongoDB Connection Error:', error);
       // If connection fails on Vercel, do not fallback to memory server
       if (isVercel) {
          console.error('Fatal: Could not connect to MongoDB on Vercel.');
          return null;
       }
    }
  }

  // Fallback to in-memory (Local Development ONLY)
  if (!isVercel) {
    try {
        console.warn('WARNING: No working MONGODB_URI provided. Using temporary in-memory database. Data will be lost on restart.');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        process.env.MONGODB_URI = mongoUri;

        cached.promise = mongoose.connect(mongoUri).then((mongoose) => {
            console.log('MongoDB Connected (Temporary In-Memory)');
            return mongoose;
        });
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        console.error('InMemory MongoDB Connection Error:', err);
    }
  }
};

// Initiate connection but don't await at top level (Vercel best practice)
connectDB();

// Middleware to check DB connection on Vercel
app.use(async (req, res, next) => {
    // If not on Vercel, continue
    if (!process.env.VERCEL && !process.env.VERCEL_ENV) return next();

    // If we have a connection, continue
    if (mongoose.connection.readyState === 1) return next();

    // If we are still connecting, wait a bit (optional, but good for cold starts)
    if (mongoose.connection.readyState === 2) {
         try {
             await connectDB();
             if (mongoose.connection.readyState === 1) return next();
         } catch(e) {
             console.error("Failed to await connection", e);
         }
    }

    // If still no connection, show error page
    if (mongoose.connection.readyState !== 1) {
        res.status(503).send(`
            <html>
                <head><title>Setup Required</title></head>
                <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h1>Setup Required</h1>
                    <p>This application is deployed on Vercel but is missing the Database Configuration.</p>
                    <p>Please go to your Vercel Project Settings > Environment Variables and add:</p>
                    <code style="background: #eee; padding: 5px; border-radius: 4px;">MONGODB_URI</code>
                    <p>value: <i>Your MongoDB Atlas Connection String</i></p>
                    <hr/>
                    <small>Whiz POS Back Office</small>
                </body>
            </html>
        `);
        return;
    }

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

if (require.main === module) {
  startServer(parseInt(DEFAULT_PORT));
}

module.exports = app;
