const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const config = require('../Configuration/Environment');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access denied. No token provided.'
                }
            });
        }

        const decoded = jwt.verify(token, config.JWT.SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token or user not found.'
                }
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_ERROR',
                message: 'Invalid token.'
            }
        });
    }
};

module.exports = auth;