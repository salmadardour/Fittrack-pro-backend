const { validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES } = require('./Constants');
const Helpers = require('./Helpers');

// Main validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Invalid input data',
                details: errors.array().map(error => ({
                    field: error.path || error.param,
                    message: error.msg,
                    value: error.value
                }))
            },
            timestamp: new Date().toISOString()
        });
    }

    next();
};

// Custom validation functions
class CustomValidators {
    // Validate MongoDB ObjectId
    static isValidObjectId(value) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(value);
    }

    // Validate password strength
    static isStrongPassword(password) {
        const validation = Helpers.validatePassword(password);
        return validation.isValid;
    }

    // Validate workout name
    static isValidWorkoutName(name) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 1 && trimmed.length <= 100;
    }

    // Validate exercise name
    static isValidExerciseName(name) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 1 && trimmed.length <= 50;
    }

    // Validate sets array
    static isValidSetsArray(sets) {
        if (!Array.isArray(sets)) return false;
        if (sets.length === 0 || sets.length > 50) return false;

        return sets.every(set => {
            // Check if set has valid structure
            if (typeof set !== 'object') return false;

            // Validate reps (optional, but if present must be valid)
            if (set.reps !== undefined) {
                if (!Number.isInteger(set.reps) || set.reps < 0 || set.reps > 1000) {
                    return false;
                }
            }

            // Validate weight (optional, but if present must be valid)
            if (set.weight !== undefined) {
                if (typeof set.weight !== 'number' || set.weight < 0 || set.weight > 10000) {
                    return false;
                }
            }

            // Validate duration (optional, but if present must be valid)
            if (set.duration !== undefined) {
                if (!Number.isInteger(set.duration) || set.duration < 0 || set.duration > 86400) {
                    return false;
                }
            }

            // Validate rest time (optional, but if present must be valid)
            if (set.restTime !== undefined) {
                if (!Number.isInteger(set.restTime) || set.restTime < 0 || set.restTime > 3600) {
                    return false;
                }
            }

            // Validate RPE (optional, but if present must be valid)
            if (set.rpe !== undefined) {
                if (!Number.isInteger(set.rpe) || set.rpe < 1 || set.rpe > 10) {
                    return false;
                }
            }

            return true;
        });
    }

    // Validate exercises array
    static isValidExercisesArray(exercises) {
        if (!Array.isArray(exercises)) return false;
        if (exercises.length === 0 || exercises.length > 20) return false;

        return exercises.every(exercise => {
            if (typeof exercise !== 'object') return false;

            // Exercise must have a name
            if (!this.isValidExerciseName(exercise.name)) return false;

            // Exercise must have valid sets
            if (!this.isValidSetsArray(exercise.sets)) return false;

            // Category is optional but must be valid if present
            if (exercise.category !== undefined) {
                const validCategories = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'];
                if (!validCategories.includes(exercise.category)) return false;
            }

            // Notes are optional but must be string if present
            if (exercise.notes !== undefined) {
                if (typeof exercise.notes !== 'string' || exercise.notes.length > 500) {
                    return false;
                }
            }

            return true;
        });
    }

    // Validate date string
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Validate fitness level
    static isValidFitnessLevel(level) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        return validLevels.includes(level);
    }

    // Validate units
    static isValidUnits(units) {
        const validUnits = ['metric', 'imperial'];
        return validUnits.includes(units);
    }

    // Validate privacy setting
    static isValidPrivacy(privacy) {
        const validPrivacy = ['public', 'private'];
        return validPrivacy.includes(privacy);
    }

    // Validate gender
    static isValidGender(gender) {
        const validGenders = ['male', 'female', 'other'];
        return validGenders.includes(gender);
    }

    // Validate goals array
    static isValidGoalsArray(goals) {
        if (!Array.isArray(goals)) return false;
        if (goals.length > 10) return false;

        return goals.every(goal => {
            return typeof goal === 'string' && goal.trim().length > 0 && goal.length <= 100;
        });
    }

    // Validate email format
    static isValidEmail(email) {
        return Helpers.isValidEmail(email);
    }

    // Validate age (must be between 13 and 120)
    static isValidAge(dateOfBirth) {
        const age = Helpers.calculateAge(dateOfBirth);
        return age >= 13 && age <= 120;
    }

    // Validate weight (kg or lbs)
    static isValidWeight(weight, units = 'metric') {
        if (typeof weight !== 'number' || weight <= 0) return false;

        if (units === 'metric') {
            return weight >= 20 && weight <= 500; // 20kg to 500kg
        } else {
            return weight >= 44 && weight <= 1100; // 44lbs to 1100lbs
        }
    }

    // Validate height (cm or inches)
    static isValidHeight(height, units = 'metric') {
        if (typeof height !== 'number' || height <= 0) return false;

        if (units === 'metric') {
            return height >= 100 && height <= 250; // 100cm to 250cm
        } else {
            return height >= 39 && height <= 98; // 39in to 98in
        }
    }

    // Validate workout duration (in seconds)
    static isValidDuration(duration) {
        return Number.isInteger(duration) && duration >= 0 && duration <= 86400; // Max 24 hours
    }

    // Validate notes field
    static isValidNotes(notes) {
        if (notes === undefined || notes === null) return true;
        return typeof notes === 'string' && notes.length <= 500;
    }
}

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
};

// Helper function to sanitize object
function sanitizeObject(obj) {
    const sanitized = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (typeof value === 'string') {
                sanitized[key] = Helpers.sanitizeInput(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item =>
                    typeof item === 'string' ? Helpers.sanitizeInput(item) : item
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
}

// Validation error handler
const handleValidationError = (error) => {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
        }));

        return Helpers.createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Validation failed',
            HTTP_STATUS.BAD_REQUEST
        );
    }

    return null;
};

// Rate limiting validation
const validateRateLimit = (windowMs, maxRequests) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old requests
        for (const [ip, timestamps] of requests.entries()) {
            requests.set(ip, timestamps.filter(time => time > windowStart));
            if (requests.get(ip).length === 0) {
                requests.delete(ip);
            }
        }

        // Check current IP
        const userRequests = requests.get(key) || [];

        if (userRequests.length >= maxRequests) {
            return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
                Helpers.createErrorResponse(
                    ERROR_CODES.RATE_LIMIT_EXCEEDED,
                    'Too many requests, please try again later'
                )
            );
        }

        // Add current request
        userRequests.push(now);
        requests.set(key, userRequests);

        next();
    };
};

module.exports = {
    validate,
    sanitizeRequest,
    handleValidationError,
    validateRateLimit,
    CustomValidators
};