exports.loginPage = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('pages/login', { title: 'Login', layout: false });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    const envUsername = process.env.BUSINESS_USERNAME || 'admin';
    const envPassword = process.env.BUSINESS_PASSWORD || 'admin123';

    if (username === envUsername && password === envPassword) {
        req.session.user = { username };
        return res.redirect('/');
    }

    res.render('pages/login', {
        title: 'Login',
        layout: false,
        error: 'Invalid credentials'
    });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
