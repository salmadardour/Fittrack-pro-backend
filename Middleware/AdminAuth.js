const adminAuth = (req, res, next) => {
    try {
        // Check if user exists (should be set by auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access denied. No user found.'
                }
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied. Admin privileges required.'
                }
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Server error in admin authorization'
            }
        });
    }
};

module.exports = adminAuth;