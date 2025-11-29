const BusinessSettings = require('../models/BusinessSettings');

exports.index = async (req, res) => {
    try {
        let settings = await BusinessSettings.findOne({});
        if (!settings) {
            settings = new BusinessSettings();
            await settings.save();
        }
        res.render('pages/settings', {
            title: 'Settings',
            settings: settings,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Settings Error:', error);
        res.render('pages/settings', {
            title: 'Settings',
            settings: {},
            error: 'Failed to load settings'
        });
    }
};

exports.update = async (req, res) => {
    try {
        const {
            businessName, phone, address, email,
            mpesaPaybill, mpesaTill, mpesaAccountNumber,
            taxRate, currency,
            receiptHeader, receiptFooter, servedByLabel, printerType, showPrintPreview,
            onScreenKeyboard
        } = req.body;

        const updateData = {
            businessName,
            phone,
            address,
            email,
            mpesaPaybill,
            mpesaTill,
            mpesaAccountNumber,
            taxRate: Number(taxRate) || 0,
            currency: currency || 'Ksh.',
            receiptHeader,
            receiptFooter,
            servedByLabel,
            printerType,
            showPrintPreview: showPrintPreview === 'on',
            onScreenKeyboard: onScreenKeyboard === 'on',
            lastUpdated: new Date()
        };

        await BusinessSettings.findOneAndUpdate({}, { $set: updateData }, { upsert: true, new: true });

        res.redirect('/settings?success=true');
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.redirect('/settings?error=' + encodeURIComponent(error.message));
    }
};
