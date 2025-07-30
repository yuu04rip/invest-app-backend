const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        const error = new Error('No token provided');
        error.status = 401;
        return next(error);
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        const error = new Error('Malformed token');
        error.status = 401;
        return next(error);
    }
    const token = parts[1];
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, decoded) => {
        if (err) {
            const error = new Error('Invalid token');
            error.status = 401;
            return next(error);
        }
        req.user = decoded;
        next();
    });
};