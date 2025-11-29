const mongoose = require('mongoose');

/**
 * Schema for User model.
 * Represents a system user (Admin, Cashier, etc.).
 */
const UserSchema = new mongoose.Schema({
  /**
   * Unique identifier synced from Desktop POS (optional).
   * Used to match users across devices.
   */
  userId: { type: String, unique: true, sparse: true },

  /**
   * Username for login.
   */
  username: { type: String, required: true, unique: true },

  /**
   * Password for web-based Back Office login.
   */
  password: { type: String },

  /**
   * PIN for POS login.
   */
  pin: { type: String },

  /**
   * Role of the user (admin, cashier, manager).
   */
  role: { type: String, enum: ['admin', 'cashier', 'manager'], default: 'cashier' },

  /**
   * Full name of the user.
   */
  name: String,

  /**
   * Email address of the user.
   * Sparse index allows multiple users to have null/undefined email.
   */
  email: { type: String, sparse: true, unique: true },

  /**
   * Whether the user account is active.
   */
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
