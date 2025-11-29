const mongoose = require('mongoose');

/**
 * Schema for Product model.
 * Represents an inventory item.
 */
const ProductSchema = new mongoose.Schema({
  /**
   * Unique identifier synced from Desktop POS.
   * Can be Number (legacy) or String (new alphanumeric IDs).
   */
  productId: { type: String, unique: true },

  /**
   * Name of the product.
   */
  name: { type: String, required: true },

  /**
   * Category of the product.
   */
  category: String,

  /**
   * Selling price of the product.
   */
  price: { type: Number, required: true },

  /**
   * Current stock quantity.
   */
  stock: { type: Number, default: 0 },

  /**
   * Minimum stock level for alerts.
   */
  minStock: { type: Number, default: 5 },

  /**
   * URL or path to the product image.
   */
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
