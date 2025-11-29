const User = require('../models/User');

exports.index = async (req, res) => {
    try {
        const users = await User.find().sort({ username: 1 });
        res.render('pages/users', {
            title: 'User Management',
            users
        });
    } catch (error) {
        console.error(error);
        res.render('pages/users', {
            title: 'User Management',
            users: [],
            error: 'Failed to load users'
        });
    }
};

exports.addUser = async (req, res) => {
    try {
        const userData = { ...req.body };

        // Remove empty email to prevent unique index error (null/empty string conflicts)
        if (!userData.email) {
            delete userData.email;
        }

        // Generate userId if not present (for Desktop POS sync)
        if (!userData.userId) {
            userData.userId = `USR${Date.now()}`;
        }

        const newUser = new User(userData);
        await newUser.save();
        res.redirect('/users');
    } catch (error) {
        console.error('Add user error:', error);
        const users = await User.find().sort({ username: 1 });
        res.render('pages/users', {
            title: 'User Management',
            users,
            error: error.code === 11000 ? 'Username or ID already exists.' : 'Error adding user. Please try again.'
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updates = { ...req.body };
        // Handle checkbox for boolean
        updates.isActive = !!req.body.isActive;
        // Remove password if empty to avoid overwriting with empty string
        if (!updates.password) delete updates.password;
        // Remove empty email
        if (!updates.email) delete updates.email;

        await User.findByIdAndUpdate(req.params.id, updates);
        res.redirect('/users');
    } catch (error) {
        console.error('Update user error:', error);
        const users = await User.find().sort({ username: 1 });
        res.render('pages/users', {
            title: 'User Management',
            users,
            error: 'Error updating user.'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users');
    } catch (error) {
        console.error('Delete user error:', error);
        const users = await User.find().sort({ username: 1 });
        res.render('pages/users', {
            title: 'User Management',
            users,
            error: 'Error deleting user.'
        });
    }
};
