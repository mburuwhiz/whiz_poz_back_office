const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Customer = require('../models/Customer');
const User = require('../models/User');
const BusinessSettings = require('../models/BusinessSettings');

exports.getData = async (req, res) => {
    try {
        const products = await Product.find({});
        const users = await User.find({});
        const expenses = await Expense.find({});
        const salaries = await Salary.find({});
        const creditCustomers = await Customer.find({});
        const businessSetup = await BusinessSettings.findOne({});

        const mapProduct = p => ({
            ...p.toObject(),
            id: p.productId,
        });

        const mapUser = u => ({
            ...u.toObject(),
            id: u.userId || u._id.toString(),
        });

        const mapExpense = e => ({
            ...e.toObject(),
            id: e.expenseId,
        });

        const mapSalary = s => ({
            ...s.toObject(),
            id: s.salaryId,
        });

        const mapCustomer = c => ({
            ...c.toObject(),
            id: c.customerId,
        });

        res.json({
            products: products.map(mapProduct),
            users: users.map(mapUser),
            expenses: expenses.map(mapExpense),
            salaries: salaries.map(mapSalary),
            creditCustomers: creditCustomers.map(mapCustomer),
            businessSetup: businessSetup ? businessSetup.toObject() : null
        });
    } catch (error) {
        console.error('Get Data Error:', error);
        res.status(500).json({ error: 'Failed to get data' });
    }
};

exports.sync = async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            const results = [];
            for (const op of req.body) {
                try {
                    await processOperation(op);
                    results.push({ opId: op.id, status: 'success' });
                } catch (opError) {
                    console.error(`Operation failed: ${op.type}`, opError);
                    results.push({ opId: op.id, status: 'failed', error: opError.message });
                }
            }
            // We return 200 even if some ops failed, to prevent the client from retrying successful ones repeatedly.
            // The client should ideally handle partial failures, but for now, clearing the queue is safer than blocking it.
            res.json({ success: true, results });
            return;
        }
        res.json({ success: true }); // fallback
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ success: false, message: 'Sync failed', error: error.message });
    }
};

exports.fullSync = async (req, res) => {
    try {
        const { products, users, expenses, customers, transactions, businessSetup } = req.body;

        if (businessSetup) {
             await processOperation({ type: 'update-business-setup', data: businessSetup });
        }
        if (products) {
            for (const p of products) {
                await processOperation({ type: 'add-product', data: p });
            }
        }
        if (users) {
            for (const u of users) {
                await processOperation({ type: 'add-user', data: u });
            }
        }
        if (expenses) {
            for (const e of expenses) {
                await processOperation({ type: 'add-expense', data: e });
            }
        }
        if (req.body.salaries) {
            for (const s of req.body.salaries) {
                await processOperation({ type: 'add-salary', data: s });
            }
        }
        if (customers) {
            for (const c of customers) {
                await processOperation({ type: 'add-credit-customer', data: c });
            }
        }
        if (transactions) {
            for (const t of transactions) {
                await processOperation({ type: 'new-transaction', data: t });
            }
        }

        res.json({ success: true, message: 'Full sync complete' });
    } catch (error) {
        console.error('Full Sync Error:', error);
        res.status(500).json({ success: false, message: 'Full sync failed', error: error.message });
    }
};

async function processOperation(op) {
    try {
        switch (op.type) {
            case 'update-business-setup':
                // We maintain a single settings document.
                // Upsert based on a static criteria or just replace the first one.
                // Here we just delete all and create one, or update if exists.
                // A safer way is to findOneAndUpdate.
                const settingsData = { ...op.data };
                delete settingsData.id; // Remove client-side ID if present
                delete settingsData._id;

                // We assume there is only one settings document.
                // Check if one exists
                const existingSettings = await BusinessSettings.findOne({});
                if (existingSettings) {
                    await BusinessSettings.updateOne({ _id: existingSettings._id }, { $set: settingsData });
                } else {
                    await BusinessSettings.create(settingsData);
                }
                break;

            case 'new-transaction':
                await Transaction.updateOne(
                    { transactionId: op.data.id },
                    {
                        $set: {
                            transactionId: op.data.id,
                            date: op.data.timestamp,
                            cashier: op.data.cashier,
                            items: op.data.items.map(i => ({
                                productId: i.product.id,
                                name: i.product.name,
                                quantity: i.quantity,
                                price: i.product.price
                            })),
                            totalAmount: op.data.total,
                            paymentMethod: op.data.paymentMethod,
                            customerName: op.data.creditCustomer
                        }
                    },
                    { upsert: true }
                );
                break;

            case 'add-product':
            case 'update-product':
                const prodData = op.type === 'update-product' ? op.data.updates : op.data;
                // prodId can be Number (legacy) or String (new alphanumeric IDs)
                const prodId = op.type === 'update-product' ? op.data.id : op.data.id;

                const prodUpdate = { ...prodData };
                if (prodId) prodUpdate.productId = prodId;
                delete prodUpdate.id; // Remove local desktop ID alias

                // Use productId to find and update
                await Product.updateOne(
                    { productId: prodId },
                    { $set: prodUpdate },
                    { upsert: true }
                );
                break;

            case 'delete-product':
                await Product.deleteOne({ productId: op.data.id });
                break;

            case 'add-expense':
                // data: Expense object
                // Ensure 'cashier' is properly saved.
                const expenseData = { ...op.data, expenseId: op.data.id };

                // Explicitly ensure cashier field is set if present in data
                if (op.data.cashier) {
                    expenseData.cashier = op.data.cashier;
                    // Also fallback to recordedBy for legacy support
                    if (!expenseData.recordedBy) {
                        expenseData.recordedBy = op.data.cashier;
                    }
                }

                await Expense.updateOne(
                    { expenseId: op.data.id },
                    { $set: expenseData },
                    { upsert: true }
                );
                break;

            case 'add-salary':
                const salaryData = { ...op.data, salaryId: op.data.id };
                delete salaryData.id;
                delete salaryData._id;

                await Salary.updateOne(
                    { salaryId: op.data.id },
                    { $set: salaryData },
                    { upsert: true }
                );
                break;

            case 'delete-salary':
                await Salary.deleteOne({ salaryId: op.data.id });
                break;

            case 'add-user':
            case 'update-user':
                const userData = op.type === 'update-user' ? op.data.updates : op.data;
                const userId = op.type === 'update-user' ? op.data.id : op.data.id;

                const userUpdate = { ...userData };
                if (userId) userUpdate.userId = userId;

                // Explicitly include PIN if present
                if (userData.pin) {
                    userUpdate.pin = userData.pin;
                }

                // Ensure email is undefined if null/empty to avoid unique index violation
                if (!userUpdate.email) {
                    delete userUpdate.email;
                }

                delete userUpdate.id; // Remove desktop ID from main object fields

                // Generate username from name if missing
                if (!userUpdate.username && userUpdate.name) {
                    userUpdate.username = userUpdate.name.toLowerCase().replace(/\s+/g, '');
                }

                // Try to find by userId first, then username
                // Upsert based on userId if present
                if (userId) {
                    await User.updateOne(
                        { userId: userId },
                        { $set: userUpdate },
                        { upsert: true }
                    );
                } else if (userUpdate.username) {
                    await User.updateOne(
                        { username: userUpdate.username },
                        { $set: userUpdate },
                        { upsert: true }
                    );
                }
                break;

            case 'delete-user':
                await User.deleteOne({ userId: op.data.id });
                break;

            case 'add-credit-customer':
            case 'update-credit-customer':
                const custId = op.type === 'update-credit-customer' ? op.data.id : op.data.id;
                const custData = op.type === 'update-credit-customer' ? op.data.updates : op.data;

                const updateData = { ...custData };
                if (custId) updateData.customerId = custId;
                delete updateData.id;
                delete updateData._id;

                await Customer.updateOne(
                    { customerId: custId },
                    { $set: updateData },
                    { upsert: true }
                );
                break;

            case 'delete-credit-customer':
                await Customer.deleteOne({ customerId: op.data.id });
                break;
        }
    } catch (e) {
        console.error(`Failed to process op ${op.type}:`, e);
    }
}

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const op = { type: 'new-transaction', data: req.body };
        await processOperation(op);
        res.json({ success: true });
    } catch (error) {
        console.error('Create Transaction Error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        // Return the URL to the uploaded image
        // Assuming the server serves static files from 'public' folder
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};
