const Customer = require('../models/Customer');

exports.index = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.render('pages/credit', {
            title: 'Credit Management',
            customers
        });
    } catch (error) {
        console.error(error);
        res.render('pages/credit', {
            title: 'Credit Management',
            customers: [],
            error: 'Failed to load customers'
        });
    }
};

exports.addCustomer = async (req, res) => {
    try {
        const customerData = {
            ...req.body,
            balance: req.body.totalCredit || 0,
            totalCredit: req.body.totalCredit || 0
        };
        // Handle initial limit if passed as "initialLimit" vs "totalCredit" form field mismatch
        if (req.body.initialLimit) {
            customerData.totalCredit = req.body.initialLimit;
            customerData.balance = req.body.initialLimit;
        }
        const newCustomer = new Customer(customerData);
        await newCustomer.save();
        res.redirect('/credit');
    } catch (error) {
        console.error('Add customer error:', error);
        res.status(500).send('Error adding customer');
    }
};

exports.recordPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).send('Customer not found');

        customer.paidAmount = (customer.paidAmount || 0) + Number(amount);
        customer.balance = Math.max(0, (customer.totalCredit || 0) - customer.paidAmount);
        // Add to history
        customer.history.push({
            date: new Date(),
            amount: Number(amount),
            type: 'payment'
        });

        await customer.save();
        res.redirect('/credit');
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).send('Error recording payment');
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.redirect('/credit');
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).send('Error deleting customer');
    }
};
