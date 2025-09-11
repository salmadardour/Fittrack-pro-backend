const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({ // creates a blueprint for user data
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function (value) {
                return value < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        lowercase: true
    },

    fitnessLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    goals: [{
        type: String,
        trim: true
    }],

    units: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric'
    },
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'private'
    },

    // Admin system fields
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    suspended: {
        type: Boolean,
        default: false
    },

    avatar: String,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    lastLoginAt: Date
}, {
    timestamps: true, // adds 'created at' and 'updated at' fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });
userSchema.index({ suspended: 1 });
userSchema.index({ lastLoginAt: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Check if user is suspended before login
userSchema.methods.isSuspended = function () {
    return this.suspended === true;
};

// Check if user is admin
userSchema.methods.isAdmin = function () {
    return this.role === 'admin';
};

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password); // adds methods for password checking
};

userSchema.methods.toJSON = function () { // customizes how user data is converted to JSON
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);