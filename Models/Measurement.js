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
    measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        biceps: Number,
        thighs: Number,
        neck: Number
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