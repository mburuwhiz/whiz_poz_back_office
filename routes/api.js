const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const multer = require('multer');
const path = require('path');

/**
 * Configure Multer for image uploads.
 * Stores uploaded files in 'public/uploads' directory.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/**
 * Middleware to check API Key.
 * Verifies 'x-api-key' or 'Authorization' header against 'API_KEY' environment variable.
 * Allows access if key matches OR in 'development' environment.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    // Allow if match OR if it's a development environment (optional, but good for testing)
    if ((apiKey && apiKey === process.env.API_KEY) || process.env.NODE_ENV === 'development') {
        next();
    } else {
        console.log('Unauthorized API access attempt. Key:', apiKey);
        res.status(401).json({ message: 'Unauthorized' });
    }
};

router.use(checkApiKey);

/**
 * POST /api/sync
 * Syncs a list of operations from Desktop POS to Back Office.
 */
router.post('/sync', apiController.sync);

/**
 * POST /api/sync/full
 * Performs a full data synchronization from Desktop POS to Back Office.
 */
router.post('/sync/full', apiController.fullSync);

/**
 * GET /api/sync
 * Retrieves current data from Back Office for synchronization.
 */
router.get('/sync', apiController.getData);

/**
 * GET /api/products
 * Retrieves list of products for Mobile App or external use.
 */
router.get('/products', apiController.getProducts);

/**
 * POST /api/transaction
 * Creates a new transaction (used by Mobile App).
 */
router.post('/transaction', apiController.createTransaction);

/**
 * POST /api/upload
 * Uploads an image file.
 * Expects a multipart/form-data request with a field named 'image'.
 */
router.post('/upload', upload.single('image'), apiController.uploadImage);

module.exports = router;
