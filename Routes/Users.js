const express = require('express');
const { body } = require('express-validator');
const User = require('../Models/User');
const auth = require('../Middleware/Auth');
const validate = require('../Middleware/Validation');

const router = express.Router();

// Validation for profile updates
const profileValidation = [
    body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('fitnessLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid fitness level'),
    body('units').optional().isIn(['metric', 'imperial']).withMessage('Invalid units'),
    body('privacy').optional().isIn(['public', 'private']).withMessage('Invalid privacy setting')
];

// GET /api/v1/users/profile - Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: error.message
            }
        });
    }
});

// PUT /api/v1/users/profile - Update user profile
router.put('/profile', auth, profileValidation, validate, async (req, res) => {
    try {
        const allowedUpdates = [
            'firstName', 'lastName', 'dateOfBirth', 'gender',
            'fitnessLevel', 'goals', 'units', 'privacy'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Don't allow email updates through this endpoint for security
        delete updates.email;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: error.message
            }
        });
    }
});

// GET /api/v1/users/stats - Get user statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const Workout = require('../Models/Workout');

        // Get user's workout statistics
        const totalWorkouts = await Workout.countDocuments({ userId: req.user._id });

        const workoutStats = await Workout.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: '$totalVolume' },
                    averageDuration: { $avg: '$totalDuration' },
                    totalExercises: { $sum: { $size: '$exercises' } }
                }
            }
        ]);

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentWorkouts = await Workout.countDocuments({
            userId: req.user._id,
            date: { $gte: thirtyDaysAgo }
        });

        const stats = {
            totalWorkouts,
            recentWorkouts: recentWorkouts,
            totalVolume: workoutStats[0]?.totalVolume || 0,
            averageDuration: Math.round(workoutStats[0]?.averageDuration || 0),
            totalExercises: workoutStats[0]?.totalExercises || 0,
            memberSince: req.user.createdAt
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'STATS_ERROR',
                message: error.message
            }
        });
    }
});

// PUT /api/v1/users/goals - Update user fitness goals
router.put('/goals', auth, async (req, res) => {
    try {
        const { goals } = req.body;

        if (!Array.isArray(goals)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_GOALS',
                    message: 'Goals must be an array'
                }
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { goals: goals.slice(0, 10) }, // Limit to 10 goals
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Goals updated successfully',
            data: { goals: user.goals }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'GOALS_UPDATE_ERROR',
                message: error.message
            }
        });
    }
});

// DELETE /api/v1/users/account - Delete user account
router.delete('/account', auth, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PASSWORD_REQUIRED',
                    message: 'Password confirmation required to delete account'
                }
            });
        }

        // Verify password before deletion
        const user = await User.findById(req.user._id).select('+password');
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Invalid password'
                }
            });
        }

        // Delete user's workouts first
        const Workout = require('../Models/Workout');
        await Workout.deleteMany({ userId: req.user._id });

        // Delete user account
        await User.findByIdAndDelete(req.user._id);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: error.message
            }
        });
    }
});

module.exports = router;