const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Workout = require('../Models/Workout');
const auth = require('../Middleware/Auth');
const adminAuth = require('../Middleware/AdminAuth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch users' }
        });
    }
});

// Get admin dashboard stats
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalWorkouts = await Workout.countDocuments();
        const activeUsers = await User.countDocuments({
            lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Recent registrations (last 30 days)
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Most active users
        const topUsers = await Workout.aggregate([
            {
                $group: {
                    _id: '$user',
                    workoutCount: { $sum: 1 }
                }
            },
            { $sort: { workoutCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    workoutCount: 1,
                    'user.firstName': 1,
                    'user.lastName': 1,
                    'user.email': 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalWorkouts,
                activeUsers,
                recentUsers,
                topUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch admin stats' }
        });
    }
});

// Delete user account (admin only)
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Don't allow admin to delete themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot delete your own account' }
            });
        }

        // Delete user's workouts first
        await Workout.deleteMany({ user: userId });

        // Delete user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        res.json({
            success: true,
            data: { message: 'User account deleted successfully' }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to delete user' }
        });
    }
});

// Update user role (admin only)
router.put('/users/:userId/role', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid role. Must be "user" or "admin"' }
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update user role' }
        });
    }
});

// Suspend/Unsuspend user account
router.put('/users/:userId/suspend', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { suspended } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { suspended: suspended || false },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update user status' }
        });
    }
});

// Get user details (admin only)
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        // Get user's workout count
        const workoutCount = await Workout.countDocuments({ user: userId });

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                workoutCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch user details' }
        });
    }
});

module.exports = router;