const mongoose = require('mongoose');

/**
 * Schema for Transaction model.
 * Represents a sales transaction.
 */
const TransactionSchema = new mongoose.Schema({
  /**
   * Unique identifier synced from Desktop POS.
   */
  transactionId: { type: String, required: true, unique: true },

  /**
   * Date of the transaction.
   */
  date: { type: Date, default: Date.now },

  /**
   * Name of the cashier who processed the transaction.
   */
  cashier: String,

  /**
   * List of items purchased.
   */
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],

  /**
   * Total amount of the transaction.
   */
  totalAmount: Number,

  /**
   * Payment method used (cash, mpesa, credit).
   */
  paymentMethod: String,

  /**
   * Name of the customer (if credit sale).
   */
  customerName: String
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
