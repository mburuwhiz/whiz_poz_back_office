const mongoose = require('mongoose');

/**
 * Schema for BusinessSettings model.
 * Stores global configuration for the business.
 */
const BusinessSettingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'WHIZ POS' },
  businessId: String,
  address: String,
  phone: String,
  email: String,
  taxRate: { type: Number, default: 0 },
  currency: { type: String, default: 'Ksh.' },
  receiptHeader: String,
  receiptFooter: String,
  mpesaPaybill: String,
  mpesaTill: String,
  mpesaAccountNumber: String,
  servedByLabel: { type: String, default: 'Served By' },
  printerType: { type: String, default: 'thermal' },
  showPrintPreview: { type: Boolean, default: false },
  onScreenKeyboard: { type: Boolean, default: true },
  isSetup: { type: Boolean, default: false },
  // Stores the date when these settings were last updated on the Desktop
  lastUpdated: Date
}, { timestamps: true });

// Ensure only one settings document exists (singleton pattern logic handled in controller usually,
// but we can just use a fixed ID or always update the first found).
module.exports = mongoose.model('BusinessSettings', BusinessSettingsSchema);
