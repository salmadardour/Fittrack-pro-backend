const crypto = require('crypto');
const { VALIDATION_LIMITS, HTTP_STATUS, ERROR_CODES } = require('./Constants');

class Helpers {
    // Generate random string
    static generateRandomString(length = 32) {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    // Generate UUID
    static generateUUID() {
        return crypto.randomUUID();
    }

    // Sanitize user input
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000); // Limit length
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    static validatePassword(password) {
        const errors = [];

        if (!password) {
            errors.push('Password is required');
            return { isValid: false, errors };
        }

        if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
            errors.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters long`);
        }

        if (password.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
            errors.push(`Password must not exceed ${VALIDATION_LIMITS.PASSWORD_MAX_LENGTH} characters`);
        }

        // Check for at least one number
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        // Check for at least one letter
        if (!/[a-zA-Z]/.test(password)) {
            errors.push('Password must contain at least one letter');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format workout duration (seconds to human readable)
    static formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0m';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let result = '';

        if (hours > 0) {
            result += `${hours}h `;
        }

        if (minutes > 0) {
            result += `${minutes}m `;
        }

        if (remainingSeconds > 0 && hours === 0) {
            result += `${remainingSeconds}s`;
        }

        return result.trim() || '0m';
    }

    // Calculate workout volume
    static calculateWorkoutVolume(exercises) {
        if (!Array.isArray(exercises)) return 0;

        return exercises.reduce((total, exercise) => {
            if (!Array.isArray(exercise.sets)) return total;

            const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                return setTotal + (weight * reps);
            }, 0);

            return total + exerciseVolume;
        }, 0);
    }

    // Format weight based on user's unit preference
    static formatWeight(weight, units = 'metric') {
        if (!weight || weight <= 0) return '0';

        if (units === 'imperial') {
            // Convert kg to lbs
            const lbs = Math.round(weight * 2.20462 * 10) / 10;
            return `${lbs} lbs`;
        }

        return `${weight} kg`;
    }

    // Convert weight between units
    static convertWeight(weight, fromUnit, toUnit) {
        if (fromUnit === toUnit) return weight;

        if (fromUnit === 'metric' && toUnit === 'imperial') {
            return Math.round(weight * 2.20462 * 10) / 10; // kg to lbs
        }

        if (fromUnit === 'imperial' && toUnit === 'metric') {
            return Math.round(weight / 2.20462 * 10) / 10; // lbs to kg
        }

        return weight;
    }

    // Create standardized API response
    static createResponse(success, data = null, message = '', error = null) {
        const response = {
            success,
            timestamp: new Date().toISOString()
        };

        if (success) {
            if (message) response.message = message;
            if (data !== null) response.data = data;
        } else {
            response.error = {
                code: error?.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
                message: error?.message || message || 'An error occurred'
            };
        }

        return response;
    }

    // Create error response
    static createErrorResponse(code, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        return {
            success: false,
            error: {
                code,
                message
            },
            timestamp: new Date().toISOString(),
            statusCode
        };
    }

    // Paginate array results
    static paginate(array, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const paginatedItems = array.slice(offset, offset + limit);

        return {
            data: paginatedItems,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(array.length / limit),
                totalItems: array.length,
                itemsPerPage: limit,
                hasNextPage: offset + limit < array.length,
                hasPreviousPage: page > 1
            }
        };
    }

    // Calculate age from date of birth
    static calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    // Get date range for analytics
    static getDateRange(period) {
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case 'quarter':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case 'year':
                startDate.setDate(endDate.getDate() - 365);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        return { startDate, endDate };
    }

    // Calculate BMI
    static calculateBMI(weight, height, units = 'metric') {
        if (!weight || !height || weight <= 0 || height <= 0) return null;

        let weightKg = weight;
        let heightM = height;

        if (units === 'imperial') {
            weightKg = weight / 2.20462; // lbs to kg
            heightM = height * 0.0254; // inches to meters
        } else {
            heightM = height / 100; // cm to meters
        }

        const bmi = weightKg / (heightM * heightM);
        return Math.round(bmi * 10) / 10;
    }

    // Get BMI category
    static getBMICategory(bmi) {
        if (!bmi) return 'Unknown';

        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    // Generate workout summary
    static generateWorkoutSummary(workout) {
        if (!workout || !workout.exercises) return null;

        const totalSets = workout.exercises.reduce((total, exercise) => {
            return total + (exercise.sets ? exercise.sets.length : 0);
        }, 0);

        const totalVolume = this.calculateWorkoutVolume(workout.exercises);
        const exerciseCount = workout.exercises.length;

        return {
            exerciseCount,
            totalSets,
            totalVolume,
            duration: workout.totalDuration || 0,
            formattedDuration: this.formatDuration(workout.totalDuration || 0)
        };
    }

    // Validate object against schema
    static validateObject(obj, requiredFields = []) {
        const errors = [];

        requiredFields.forEach(field => {
            if (!obj.hasOwnProperty(field) || obj[field] === null || obj[field] === undefined) {
                errors.push(`${field} is required`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Remove undefined/null values from object
    static cleanObject(obj) {
        const cleaned = {};

        Object.keys(obj).forEach(key => {
            if (obj[key] !== null && obj[key] !== undefined) {
                cleaned[key] = obj[key];
            }
        });

        return cleaned;
    }

    // Sleep function for delays
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if date is today
    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);

        return checkDate.getDate() === today.getDate() &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear();
    }

    // Get day of week name
    static getDayName(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(date).getDay()];
    }

    // Format date for display
    static formatDate(date, format = 'short') {
        const d = new Date(date);

        if (format === 'short') {
            return d.toLocaleDateString();
        }

        if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (format === 'time') {
            return d.toLocaleTimeString();
        }

        return d.toLocaleString();
    }
}

module.exports = Helpers;