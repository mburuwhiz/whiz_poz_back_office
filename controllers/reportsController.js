const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const CreditCustomer = require('../models/Customer'); // Assuming this is the model name

exports.index = async (req, res) => {
    try {
        // Default to today
        const today = new Date();
        const startDate = req.query.startDate || today.toISOString().split('T')[0];
        const endDate = req.query.endDate || today.toISOString().split('T')[0];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch Transactions
        const transactions = await Transaction.find({
            timestamp: { $gte: start.toISOString(), $lte: end.toISOString() }
        });

        // Fetch Expenses
        const expenses = await Expense.find({
            timestamp: { $gte: start.toISOString(), $lte: end.toISOString() }
        });

        // Fetch Salaries
        const salaries = await Salary.find({
            date: { $gte: start, $lte: end }
        });

        // Calculate Sales Summary
        const salesSummary = {
            totalSales: 0,
            cash: 0,
            mpesa: 0,
            credit: 0,
            transactionCount: transactions.length
        };

        const productSales = {};

        transactions.forEach(t => {
            salesSummary.totalSales += t.total;
            if (t.paymentMethod === 'cash') salesSummary.cash += t.total;
            if (t.paymentMethod === 'mpesa') salesSummary.mpesa += t.total;
            if (t.paymentMethod === 'credit') salesSummary.credit += t.total;

            t.items.forEach(item => {
                const key = item.product.name;
                if (!productSales[key]) {
                    productSales[key] = { quantity: 0, revenue: 0 };
                }
                productSales[key].quantity += item.quantity;
                productSales[key].revenue += item.product.price * item.quantity;
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0);

        res.render('pages/reports', {
            title: 'Reports',
            dateRange: { startDate, endDate },
            salesSummary,
            topProducts,
            totalExpenses,
            totalSalaries,
            netProfit: salesSummary.totalSales - totalExpenses - totalSalaries,
            transactions: transactions.slice(0, 50), // Limit to recent 50 for display
            expenses
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.render('pages/reports', {
            title: 'Reports',
            error: 'Failed to generate report',
            dateRange: { startDate: '', endDate: '' },
            salesSummary: { totalSales: 0, cash: 0, mpesa: 0, credit: 0, transactionCount: 0 },
            topProducts: [],
            totalExpenses: 0,
            netProfit: 0,
            transactions: [],
            expenses: []
        });
    }
};
