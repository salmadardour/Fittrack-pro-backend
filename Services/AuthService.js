const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const config = require('../Configuration/Environment');

class AuthService {
    // Generate JWT tokens
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { id: userId },
            config.JWT.SECRET,
            { expiresIn: config.JWT.EXPIRE }
        );

        const refreshToken = jwt.sign(
            { id: userId },
            config.JWT.REFRESH_SECRET,
            { expiresIn: config.JWT.REFRESH_EXPIRE }
        );

        return { accessToken, refreshToken };
    }

    // Register new user
    async register(userData) {
        const { email, password, firstName, lastName } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists with this email');
            error.statusCode = 400;
            error.code = 'USER_EXISTS';
            throw error;
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName
        });

        await user.save();

        // Generate tokens
        const tokens = this.generateTokens(user._id);

        return {
            user,
            ...tokens
        };
    }

    // Login user
    async login(credentials) {
        const { email, password } = credentials;

        // Find user and include password for comparison
        const user = await User.findOne({ email, isActive: true }).select('+password');
        if (!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokens = this.generateTokens(user._id);

        // Remove password from user object
        user.password = undefined;

        return {
            user,
            ...tokens
        };
    }

    // Refresh access token
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.JWT.REFRESH_SECRET);
            const user = await User.findById(decoded.id);

            if (!user || !user.isActive) {
                const error = new Error('Invalid refresh token');
                error.statusCode = 401;
                error.code = 'INVALID_REFRESH_TOKEN';
                throw error;
            }

            const tokens = this.generateTokens(user._id);
            return tokens;
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                const newError = new Error('Invalid refresh token');
                newError.statusCode = 401;
                newError.code = 'INVALID_REFRESH_TOKEN';
                throw newError;
            }
            throw error;
        }
    }

    // Logout user (invalidate refresh token)
    async logout(userId) {
        // In a production app, you might want to maintain a blacklist of tokens
        // For now, we'll just return success
        return { message: 'Logged out successfully' };
    }

    // Verify access token
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, config.JWT.SECRET);
            const user = await User.findById(decoded.id);

            if (!user || !user.isActive) {
                const error = new Error('Invalid token');
                error.statusCode = 401;
                error.code = 'INVALID_TOKEN';
                throw error;
            }

            return user;
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                const newError = new Error('Invalid token');
                newError.statusCode = 401;
                newError.code = 'INVALID_TOKEN';
                throw newError;
            }
            throw error;
        }
    }

    // Generate password reset token
    async generatePasswordResetToken(email) {
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            // Don't reveal if user exists for security
            return { message: 'If the email exists, a reset link has been sent' };
        }

        const resetToken = jwt.sign(
            { id: user._id, purpose: 'password_reset' },
            config.JWT.SECRET,
            { expiresIn: '1h' }
        );

        // In a real app, you would send this token via email
        // For now, we'll just return it
        return {
            message: 'Password reset token generated',
            resetToken // Remove this in production
        };
    }

    // Reset password with token
    async resetPassword(resetToken, newPassword) {
        try {
            const decoded = jwt.verify(resetToken, config.JWT.SECRET);

            if (decoded.purpose !== 'password_reset') {
                const error = new Error('Invalid reset token');
                error.statusCode = 400;
                error.code = 'INVALID_RESET_TOKEN';
                throw error;
            }

            const user = await User.findById(decoded.id);
            if (!user || !user.isActive) {
                const error = new Error('Invalid reset token');
                error.statusCode = 400;
                error.code = 'INVALID_RESET_TOKEN';
                throw error;
            }

            user.password = newPassword;
            await user.save();

            return { message: 'Password reset successfully' };
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                const newError = new Error('Invalid or expired reset token');
                newError.statusCode = 400;
                newError.code = 'INVALID_RESET_TOKEN';
                throw newError;
            }
            throw error;
        }
    }
}

module.exports = new AuthService();