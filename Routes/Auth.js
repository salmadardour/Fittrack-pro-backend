const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const config = require('../Configuration/Environment');
const validate = require('../Middleware/Validation');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
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
};

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
];

// Register route
router.post('/register', registerValidation, validate, async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User already exists with this email'
                }
            });
        }

        const user = new User({ email, password, firstName, lastName });
        await user.save();

        const tokens = generateTokens(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user, ...tokens }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'REGISTRATION_ERROR',
                message: error.message
            }
        });
    }
});

// Login route
router.post('/login', loginValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isActive: true }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const tokens = generateTokens(user._id);
        user.password = undefined;

        res.json({
            success: true,
            message: 'Login successful',
            data: { user, ...tokens }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'LOGIN_ERROR',
                message: error.message
            }
        });
    }
});

module.exports = router;