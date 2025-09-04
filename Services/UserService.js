const User = require('../Models/User');
const Workout = require('../Models/Workout');

class UserService {
    // Get user profile by ID
    async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }
        return user;
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        const allowedUpdates = [
            'firstName', 'lastName', 'dateOfBirth', 'gender',
            'fitnessLevel', 'goals', 'units', 'privacy', 'avatar'
        ];

        const updates = {};
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = updateData[key];
            }
        });

        // Validate fitness level
        if (updates.fitnessLevel && !['beginner', 'intermediate', 'advanced'].includes(updates.fitnessLevel)) {
            const error = new Error('Invalid fitness level');
            error.statusCode = 400;
            error.code = 'INVALID_FITNESS_LEVEL';
            throw error;
        }

        // Validate units
        if (updates.units && !['metric', 'imperial'].includes(updates.units)) {
            const error = new Error('Invalid units');
            error.statusCode = 400;
            error.code = 'INVALID_UNITS';
            throw error;
        }

        // Validate privacy
        if (updates.privacy && !['public', 'private'].includes(updates.privacy)) {
            const error = new Error('Invalid privacy setting');
            error.statusCode = 400;
            error.code = 'INVALID_PRIVACY';
            throw error;
        }

        // Limit goals array to 10 items
        if (updates.goals && Array.isArray(updates.goals)) {
            updates.goals = updates.goals.slice(0, 10);
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        return user;
    }

    // Get user statistics
    async getUserStats(userId) {
        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // Get workout statistics
        const totalWorkouts = await Workout.countDocuments({ userId });

        const workoutStats = await Workout.aggregate([
            { $match: { userId: userId } },
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
            userId,
            date: { $gte: thirtyDaysAgo }
        });

        // Get workout frequency by day of week
        const workoutsByDay = await Workout.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: { $dayOfWeek: '$date' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Get most popular exercises
        const popularExercises = await Workout.aggregate([
            { $match: { userId } },
            { $unwind: '$exercises' },
            {
                $group: {
                    _id: '$exercises.name',
                    count: { $sum: 1 },
                    totalSets: { $sum: { $size: '$exercises.sets' } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const stats = {
            totalWorkouts,
            recentWorkouts,
            totalVolume: workoutStats[0]?.totalVolume || 0,
            averageDuration: Math.round(workoutStats[0]?.averageDuration || 0),
            totalExercises: workoutStats[0]?.totalExercises || 0,
            memberSince: user.createdAt,
            workoutsByDay: workoutsByDay.map(day => ({
                dayOfWeek: day._id,
                count: day.count
            })),
            popularExercises: popularExercises.map(exercise => ({
                name: exercise._id,
                workouts: exercise.count,
                totalSets: exercise.totalSets
            }))
        };

        return stats;
    }

    // Update user goals
    async updateGoals(userId, goals) {
        if (!Array.isArray(goals)) {
            const error = new Error('Goals must be an array');
            error.statusCode = 400;
            error.code = 'INVALID_GOALS_FORMAT';
            throw error;
        }

        // Validate and clean goals
        const cleanedGoals = goals
            .filter(goal => typeof goal === 'string' && goal.trim().length > 0)
            .map(goal => goal.trim())
            .slice(0, 10); // Limit to 10 goals

        const user = await User.findByIdAndUpdate(
            userId,
            { goals: cleanedGoals },
            { new: true, runValidators: true }
        );

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        return { goals: user.goals };
    }

    // Delete user account and all associated data
    async deleteAccount(userId, password) {
        // Get user with password for verification
        const user = await User.findById(userId).select('+password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const error = new Error('Invalid password');
            error.statusCode = 401;
            error.code = 'INVALID_PASSWORD';
            throw error;
        }

        // Delete all user's workouts first
        await Workout.deleteMany({ userId });

        // Delete user account
        await User.findByIdAndDelete(userId);

        return { message: 'Account and all associated data deleted successfully' };
    }

    // Get user's workout summary
    async getWorkoutSummary(userId, days = 30) {
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const summary = await Workout.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    totalVolume: { $sum: '$totalVolume' },
                    totalDuration: { $sum: '$totalDuration' },
                    averageVolume: { $avg: '$totalVolume' },
                    averageDuration: { $avg: '$totalDuration' }
                }
            }
        ]);

        return {
            period: `Last ${days} days`,
            totalWorkouts: summary[0]?.totalWorkouts || 0,
            totalVolume: summary[0]?.totalVolume || 0,
            totalDuration: summary[0]?.totalDuration || 0,
            averageVolume: Math.round(summary[0]?.averageVolume || 0),
            averageDuration: Math.round(summary[0]?.averageDuration || 0)
        };
    }

    // Search users (for social features - respects privacy settings)
    async searchUsers(query, currentUserId, limit = 10) {
        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Exclude current user
                { privacy: 'public' }, // Only public profiles
                { isActive: true }, // Only active users
                {
                    $or: [
                        { firstName: { $regex: query, $options: 'i' } },
                        { lastName: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        })
            .select('firstName lastName fitnessLevel createdAt')
            .limit(limit);

        return users;
    }
}

module.exports = new UserService();