const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                next(new Error("Forbidden"))
            } else {
                socket.userId = decoded.id;
                next();
            }
        });
    } else {
        next(new Error("Forbidden"))
    }
};