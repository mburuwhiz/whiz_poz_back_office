const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const salesController = require('../controllers/salesController');
const inventoryController = require('../controllers/inventoryController');
const expensesController = require('../controllers/expensesController');
const creditController = require('../controllers/creditController');
const reportsController = require('../controllers/reportsController');
const usersController = require('../controllers/usersController');
const settingsController = require('../controllers/settingsController');
const salariesController = require('../controllers/salariesController');

/**
 * Middleware to require authentication for protected routes.
 * Redirects to login page if user is not authenticated.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

// Public Routes
/**
 * GET /login
 * Renders the login page.
 */
router.get('/login', authController.loginPage);

/**
 * POST /login
 * Handles user login submission.
 */
router.post('/login', authController.login);

/**
 * GET /logout
 * Logs out the user and redirects to login page.
 */
router.get('/logout', authController.logout);

// Protected Routes
router.use(requireAuth);

/**
 * GET /
 * Renders the dashboard page.
 */
router.get('/', dashboardController.index);

/**
 * GET /sales
 * Renders the sales history page.
 */
router.get('/sales', salesController.index);

/**
 * GET /inventory
 * Renders the inventory management page.
 */
router.get('/inventory', inventoryController.index);

/**
 * POST /inventory/add
 * Adds a new product to inventory.
 */
router.post('/inventory/add', inventoryController.addProduct);

/**
 * POST /inventory/edit/:id
 * Updates an existing product in inventory.
 */
router.post('/inventory/edit/:id', inventoryController.updateProduct);

/**
 * POST /inventory/delete/:id
 * Deletes a product from inventory.
 */
router.post('/inventory/delete/:id', inventoryController.deleteProduct);

/**
 * GET /expenses
 * Renders the expenses management page.
 */
router.get('/expenses', expensesController.index);

/**
 * POST /expenses/add
 * Adds a new expense record.
 */
router.post('/expenses/add', expensesController.addExpense);

/**
 * POST /expenses/delete/:id
 * Deletes an expense record.
 */
router.post('/expenses/delete/:id', expensesController.deleteExpense);

/**
 * GET /credit
 * Renders the credit customers management page.
 */
router.get('/credit', creditController.index);

/**
 * POST /credit/add
 * Adds a new credit customer.
 */
router.post('/credit/add', creditController.addCustomer);

/**
 * POST /credit/payment/:id
 * Records a payment for a credit customer.
 */
router.post('/credit/payment/:id', creditController.recordPayment);

/**
 * POST /credit/delete/:id
 * Deletes a credit customer.
 */
router.post('/credit/delete/:id', creditController.deleteCustomer);

/**
 * GET /salaries
 * Renders the salaries management page.
 */
router.get('/salaries', salariesController.getSalaries);

/**
 * POST /salaries/add
 * Adds a new salary record.
 */
router.post('/salaries/add', salariesController.addSalary);

/**
 * POST /salaries/delete/:id
 * Deletes a salary record.
 */
router.post('/salaries/delete/:id', salariesController.deleteSalary);

/**
 * GET /reports
 * Renders the reports page.
 */
router.get('/reports', reportsController.index);

/**
 * GET /users
 * Renders the user management page.
 */
router.get('/users', usersController.index);

/**
 * POST /users/add
 * Adds a new system user.
 */
router.post('/users/add', usersController.addUser);

/**
 * POST /users/edit/:id
 * Updates an existing system user.
 */
router.post('/users/edit/:id', usersController.updateUser);

/**
 * POST /users/delete/:id
 * Deletes a system user.
 */
router.post('/users/delete/:id', usersController.deleteUser);

/**
 * GET /settings
 * Renders the settings page.
 */
router.get('/settings', settingsController.index);

/**
 * POST /settings
 * Updates business settings.
 */
router.post('/settings', settingsController.update);

module.exports = router;
