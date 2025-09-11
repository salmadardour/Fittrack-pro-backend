const express = require('express');
const Measurement = require('../Models/Measurement');
const auth = require('../Middleware/Auth');

const router = express.Router();

// Get all measurements for user
router.get('/', auth, async (req, res) => {
    try {
        const measurements = await Measurement.find({ user: req.user.id })
            .sort({ date: -1 });

        res.json({
            success: true,
            data: measurements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch measurements' }
        });
    }
});

// Create new measurement
router.post('/', auth, async (req, res) => {
    try {
        const measurementData = {
            ...req.body,
            user: req.user.id
        };

        const measurement = new Measurement(measurementData);
        await measurement.save();

        res.status(201).json({
            success: true,
            data: measurement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to create measurement'
            }
        });
    }
});

// Get specific measurement
router.get('/:id', auth, async (req, res) => {
    try {
        const measurement = await Measurement.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!measurement) {
            return res.status(404).json({
                success: false,
                error: { message: 'Measurement not found' }
            });
        }

        res.json({
            success: true,
            data: measurement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch measurement' }
        });
    }
});

// Update measurement
router.put('/:id', auth, async (req, res) => {
    try {
        const measurement = await Measurement.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!measurement) {
            return res.status(404).json({
                success: false,
                error: { message: 'Measurement not found' }
            });
        }

        res.json({
            success: true,
            data: measurement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update measurement'
            }
        });
    }
});

// Delete measurement
router.delete('/:id', auth, async (req, res) => {
    try {
        const measurement = await Measurement.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!measurement) {
            return res.status(404).json({
                success: false,
                error: { message: 'Measurement not found' }
            });
        }

        res.json({
            success: true,
            data: { message: 'Measurement deleted successfully' }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to delete measurement' }
        });
    }
});

module.exports = router;