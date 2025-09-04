const express = require('express');
const { body } = require('express-validator');
const Workout = require('../Models/Workout');
const auth = require('../Middleware/Auth');
const validate = require('../Middleware/Validation');

const router = express.Router();

// Validation for workout creation
const workoutValidation = [
    body('name').trim().isLength({ min: 1 }).withMessage('Workout name is required'),
    body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required')
];

// GET /api/v1/workouts - Get user's workouts
router.get('/', auth, async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(20);

        res.json({
            success: true,
            data: workouts,
            count: workouts.length
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

// POST /api/v1/workouts - Create workout
router.post('/', auth, workoutValidation, validate, async (req, res) => {
    try {
        const workoutData = {
            ...req.body,
            userId: req.user._id
        };

        const workout = new Workout(workoutData);
        await workout.save();

        res.status(201).json({
            success: true,
            message: 'Workout created successfully',
            data: workout
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_ERROR',
                message: error.message
            }
        });
    }
});

// GET /api/v1/workouts/:id - Get specific workout
router.get('/:id', auth, async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!workout) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'WORKOUT_NOT_FOUND',
                    message: 'Workout not found'
                }
            });
        }

        res.json({
            success: true,
            data: workout
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

// PUT /api/v1/workouts/:id - Update workout
router.put('/:id', auth, workoutValidation, validate, async (req, res) => {
    try {
        const workout = await Workout.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!workout) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'WORKOUT_NOT_FOUND',
                    message: 'Workout not found'
                }
            });
        }

        res.json({
            success: true,
            message: 'Workout updated successfully',
            data: workout
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

// DELETE /api/v1/workouts/:id - Delete workout
router.delete('/:id', auth, async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!workout) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'WORKOUT_NOT_FOUND',
                    message: 'Workout not found'
                }
            });
        }

        res.json({
            success: true,
            message: 'Workout deleted successfully'
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