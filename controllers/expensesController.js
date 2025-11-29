const Expense = require('../models/Expense');

exports.index = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.render('pages/expenses', {
            title: 'Expenses',
            expenses
        });
    } catch (error) {
        console.error(error);
        res.render('pages/expenses', {
            title: 'Expenses',
            expenses: [],
            error: 'Failed to load expenses'
        });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const expenseData = req.body;
        // Generate expenseId if not present
        if (!expenseData.expenseId) {
            expenseData.expenseId = `EXP${Date.now()}`;
        }
        const newExpense = new Expense(expenseData);
        await newExpense.save();
        res.redirect('/expenses');
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).send('Error adding expense');
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.redirect('/expenses');
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).send('Error deleting expense');
    }
};
