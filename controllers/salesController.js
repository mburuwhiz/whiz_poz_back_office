const Transaction = require('../models/Transaction');

exports.index = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }).limit(100);
        res.render('pages/sales', {
            title: 'Sales',
            transactions
        });
    } catch (error) {
        console.error(error);
        res.render('pages/sales', {
            title: 'Sales',
            transactions: [],
            error: 'Failed to load transactions'
        });
    }
};
