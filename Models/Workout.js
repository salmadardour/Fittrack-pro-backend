const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
    reps: {
        type: Number,
        min: [0, 'Reps cannot be negative']
    },
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative']
    },
    duration: {
        type: Number,
        min: [0, 'Duration cannot be negative']
    },
    restTime: {
        type: Number,
        min: [0, 'Rest time cannot be negative']
    },
    rpe: {
        type: Number,
        min: 1,
        max: 10
    }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Exercise name is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'],
        lowercase: true
    },
    sets: [setSchema],
    notes: String
}, { _id: false });

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Workout name is required'],
        trim: true,
        maxlength: [100, 'Workout name cannot exceed 100 characters']
    },
    date: {
        type: Date,
        required: [true, 'Workout date is required'],
        default: Date.now
    },
    exercises: [exerciseSchema],
    totalDuration: {
        type: Number,
        min: [0, 'Duration cannot be negative']
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    totalVolume: Number
}, {
    timestamps: true
});

workoutSchema.index({ userId: 1, date: -1 });

workoutSchema.pre('save', function (next) {
    if (this.exercises && this.exercises.length > 0) {
        this.totalVolume = this.exercises.reduce((total, exercise) => {
            const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
                return setTotal + ((set.weight || 0) * (set.reps || 0));
            }, 0);
            return total + exerciseVolume;
        }, 0);
    }
    next();
});

module.exports = mongoose.model('Workout', workoutSchema);