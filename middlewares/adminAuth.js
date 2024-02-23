const isAdminLoggedIn = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin');
    }
};

const isAdminLoggedOut = (req, res, next) => {
    if (!req.session.admin) {
        next();
    } else {
        res.redirect('/admin/pages/dashboard'); 
    }
};

module.exports = { isAdminLoggedIn, isAdminLoggedOut };
