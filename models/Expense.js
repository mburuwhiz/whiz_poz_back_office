const mongoose = require('mongoose');

/**
 * Schema for Expense model.
 * Represents an expense record.
 */
const ExpenseSchema = new mongoose.Schema({
  /**
   * Unique identifier synced from Desktop POS.
   */
  expenseId: { type: String, unique: true },

  /**
   * Description of the expense.
   */
  description: { type: String, required: true },

  /**
   * Amount of the expense.
   */
  amount: { type: Number, required: true },

  /**
   * Category of the expense.
   */
  category: String,

  /**
   * Date when the expense was recorded.
   */
  date: { type: Date, default: Date.now },

  /**
   * Name of the user who recorded the expense.
   * 'recordedBy' is the legacy field, 'cashier' is the field synced from Desktop.
   * We keep both or unify them. The controller maps 'cashier' to 'recordedBy'.
   * But adding 'cashier' here explicitly ensures data persistence if mapping fails or changes.
   */
  recordedBy: String,
  cashier: String
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
