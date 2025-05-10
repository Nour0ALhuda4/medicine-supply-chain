const jwt = require('jsonwebtoken');

const jwtSecret = "yourSecretKey"; // ideally from env variable

function authenticateToken(req, res, next) {
    // Check for token in cookie or Authorization header
    const cookieToken = req.cookies.token;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1];
    
    const token = cookieToken || bearerToken;
    
    if (!token) {
        console.log('No token found in cookie or Authorization header');
        return res.status(401).send("Access denied. No token provided.");
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).send("Invalid token.");
        }
        console.log('Token verified, user:', user);
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
    jwtSecret
};