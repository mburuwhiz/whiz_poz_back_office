const mongoose = require('mongoose');

/**
 * Schema for Customer model.
 * Represents a credit customer.
 */
const CustomerSchema = new mongoose.Schema({
  /**
   * Unique identifier synced from Desktop POS.
   */
  customerId: { type: String, unique: true, sparse: true },

  /**
   * Name of the customer.
   */
  name: { type: String, required: true },

  /**
   * Phone number of the customer.
   */
  phone: String,

  /**
   * Current balance (amount owed).
   */
  balance: { type: Number, default: 0 },

  /**
   * Total credit taken.
   */
  totalCredit: { type: Number, default: 0 },

  /**
   * Total amount paid back.
   */
  paidAmount: { type: Number, default: 0 },

  /**
   * History of credit transactions and payments.
   */
  history: [{
    date: Date,
    amount: Number,
    type: { type: String, enum: ['credit', 'payment'] },
    transactionId: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
