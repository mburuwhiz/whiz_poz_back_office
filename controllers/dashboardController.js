const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.index = async (req, res) => {
    try {
        // 1. Total Sales (Sum of all transactions)
        const totalSalesResult = await Transaction.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

        // 2. Transactions Count
        const transactionCount = await Transaction.countDocuments();

        // 3. Inventory Value (Sum of price * stock)
        const inventoryValueResult = await Product.aggregate([
            { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$stock"] } } } }
        ]);
        const inventoryValue = inventoryValueResult.length > 0 ? inventoryValueResult[0].total : 0;

        // 4. Credit Due (Sum of balance for customers)
        const creditDueResult = await Customer.aggregate([
            { $group: { _id: null, total: { $sum: "$balance" } } }
        ]);
        const creditDue = creditDueResult.length > 0 ? creditDueResult[0].total : 0;

        // 5. Recent Transactions
        const recentTransactions = await Transaction.find().sort({ date: -1 }).limit(5);

        // 6. Sales Data for Chart (Last 7 Days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const dailySales = await Transaction.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const chartLabels = [];
        const chartData = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            chartLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            const sales = dailySales.find(s => s._id === dateStr);
            chartData.push(sales ? sales.total : 0);
        }

        res.render('pages/dashboard', {
            title: 'Dashboard',
            stats: {
                totalSales,
                transactionCount,
                inventoryValue,
                creditDue
            },
            recentTransactions,
            chartData: JSON.stringify({ labels: chartLabels, data: chartData })
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.render('pages/dashboard', {
            title: 'Dashboard',
            stats: { totalSales: 0, transactionCount: 0, inventoryValue: 0, creditDue: 0 },
            recentTransactions: [],
            chartData: '{"labels":[], "data":[]}',
            error: 'Failed to load dashboard data'
        });
    }
};
