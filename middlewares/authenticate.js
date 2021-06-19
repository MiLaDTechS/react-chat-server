const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        if (authHeader.split(' ')[0] === 'Bearer') {
            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    res.status(403).json(err);
                } else {
                    req.user = {
                        id: decoded.id,
                        email: decoded.email
                    };
                    next();
                }
            });
        } else {
            res.status(403).json({ messages: 'Invalid authorization header' });
        }
    } else {
        res.status(403).json({ messages: 'Authorization header is missing' });
    }
};