const Product = require('../models/Product');

exports.index = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('pages/inventory', {
            title: 'Inventory',
            products
        });
    } catch (error) {
        console.error(error);
        res.render('pages/inventory', {
            title: 'Inventory',
            products: [],
            error: 'Failed to load inventory'
        });
    }
};

exports.addProduct = async (req, res) => {
    try {
        console.log('Add Product Request Body:', req.body);
        const productData = req.body;
        // Generate productId if not present (required by Schema)
        if (!productData.productId) {
            productData.productId = Date.now();
        }
        const newProduct = new Product(productData);
        await newProduct.save();
        console.log('Product saved successfully');
        res.redirect('/inventory');
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).send('Error adding product: ' + error.message);
    }
};

exports.updateProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/inventory');
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).send('Error updating product');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/inventory');
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).send('Error deleting product');
    }
};
