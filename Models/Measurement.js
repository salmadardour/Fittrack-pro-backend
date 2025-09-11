const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    weight: {
        type: Number,
        min: [20, 'Weight must be at least 20'],
        max: [1000, 'Weight cannot exceed 1000']
    },
    bodyFat: {
        type: Number,
        min: [0, 'Body fat cannot be negative'],
        max: [100, 'Body fat percentage cannot exceed 100']
    },
    muscleMass: {
        type: Number,
        min: [0, 'Muscle mass cannot be negative']
    },
    chest: {
        type: Number,
        min: [0, 'Chest measurement cannot be negative']
    },
    waist: {
        type: Number,
        min: [0, 'Waist measurement cannot be negative']
    },
    hips: {
        type: Number,
        min: [0, 'Hips measurement cannot be negative']
    },
    biceps: {
        type: Number,
        min: [0, 'Biceps measurement cannot be negative']
    },
    thighs: {
        type: Number,
        min: [0, 'Thighs measurement cannot be negative']
    },
    neck: {
        type: Number,
        min: [0, 'Neck measurement cannot be negative']
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient queries
measurementSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Measurement', measurementSchema);