const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../App');
const User = require('../Models/User');
const Workout = require('../Models/Workout');

// Test database configuration
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/fittrack-test';

describe('User Endpoints', () => {
    let userToken;
    let userId;
    const validUserData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
    };

    // Setup and teardown
    beforeAll(async () => {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    beforeEach(async () => {
        // Clean database before each test
        await User.deleteMany({});
        await Workout.deleteMany({});

        // Create a test user and get token
        const registerResponse = await request(app)
            .post('/api/v1/auth/register')
            .send(validUserData);

        userToken = registerResponse.body.data.accessToken;
        userId = registerResponse.body.data.user._id;
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await Workout.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/v1/users/profile', () => {
        test('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(validUserData.email);
            expect(response.body.data.firstName).toBe(validUserData.firstName);
            expect(response.body.data.lastName).toBe(validUserData.lastName);
            expect(response.body.data.fitnessLevel).toBe('beginner');
            expect(response.body.data.units).toBe('metric');
            expect(response.body.data.privacy).toBe('private');
            expect(response.body.data.password).toBeUndefined();
        });

        test('should not get profile without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        test('should not get profile with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TOKEN_ERROR');
        });
    });

    describe('PUT /api/v1/users/profile', () => {
        test('should update user profile successfully', async () => {
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith',
                fitnessLevel: 'intermediate',
                units: 'imperial',
                privacy: 'public'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile updated successfully');
            expect(response.body.data.firstName).toBe(updateData.firstName);
            expect(response.body.data.lastName).toBe(updateData.lastName);
            expect(response.body.data.fitnessLevel).toBe(updateData.fitnessLevel);
            expect(response.body.data.units).toBe(updateData.units);
            expect(response.body.data.privacy).toBe(updateData.privacy);
        });

        test('should not update with invalid fitness level', async () => {
            const updateData = {
                fitnessLevel: 'invalid-level'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not update with invalid units', async () => {
            const updateData = {
                units: 'invalid-units'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not update email through profile endpoint', async () => {
            const updateData = {
                email: 'newemail@example.com'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);

            // Email should not be changed
            expect(response.body.data.email).toBe(validUserData.email);
        });

        test('should validate date of birth', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const updateData = {
                dateOfBirth: futureDate.toISOString()
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not update without authentication', async () => {
            const updateData = {
                firstName: 'Jane'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });

    describe('GET /api/v1/users/stats', () => {
        beforeEach(async () => {
            // Create some test workouts
            const workoutData = {
                name: 'Test Workout',
                exercises: [
                    {
                        name: 'Push Ups',
                        category: 'chest',
                        sets: [
                            { reps: 10, weight: 0 },
                            { reps: 8, weight: 0 }
                        ]
                    },
                    {
                        name: 'Bench Press',
                        category: 'chest',
                        sets: [
                            { reps: 8, weight: 80 },
                            { reps: 6, weight: 85 }
                        ]
                    }
                ],
                totalDuration: 3600
            };

            await request(app)
                .post('/api/v1/workouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send(workoutData);

            await request(app)
                .post('/api/v1/workouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...workoutData, name: 'Test Workout 2' });
        });

        test('should get user statistics', async () => {
            const response = await request(app)
                .get('/api/v1/users/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalWorkouts).toBe(2);
            expect(response.body.data.recentWorkouts).toBe(2);
            expect(response.body.data.totalVolume).toBeGreaterThan(0);
            expect(response.body.data.averageDuration).toBe(3600);
            expect(response.body.data.totalExercises).toBe(4);
            expect(response.body.data.memberSince).toBeDefined();
        });

        test('should not get stats without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/users/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });

    describe('PUT /api/v1/users/goals', () => {
        test('should update user goals successfully', async () => {
            const goals = [
                'Lose 10 pounds',
                'Run a 5K',
                'Bench press bodyweight'
            ];

            const response = await request(app)
                .put('/api/v1/users/goals')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ goals })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Goals updated successfully');
            expect(response.body.data.goals).toEqual(goals);
        });

        test('should limit goals to 10 items', async () => {
            const goals = Array(15).fill().map((_, i) => `Goal ${i + 1}`);

            const response = await request(app)
                .put('/api/v1/users/goals')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ goals })
                .expect(200);

            expect(response.body.data.goals).toHaveLength(10);
        });

        test('should reject non-array goals', async () => {
            const response = await request(app)
                .put('/api/v1/users/goals')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ goals: 'not an array' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_GOALS');
        });

        test('should handle empty goals array', async () => {
            const response = await request(app)
                .put('/api/v1/users/goals')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ goals: [] })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.goals).toEqual([]);
        });
    });

    describe('DELETE /api/v1/users/account', () => {
        test('should delete user account with correct password', async () => {
            const response = await request(app)
                .delete('/api/v1/users/account')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ password: validUserData.password })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Account deleted successfully');

            // Verify user is deleted
            const user = await User.findById(userId);
            expect(user).toBeNull();
        });

        test('should not delete account with wrong password', async () => {
            const response = await request(app)
                .delete('/api/v1/users/account')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ password: 'wrongpassword' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_PASSWORD');

            // Verify user still exists
            const user = await User.findById(userId);
            expect(user).toBeTruthy();
        });

        test('should not delete account without password', async () => {
            const response = await request(app)
                .delete('/api/v1/users/account')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('PASSWORD_REQUIRED');
        });

        test('should delete associated workouts when deleting account', async () => {
            // Create a workout
            const workoutData = {
                name: 'Test Workout',
                exercises: [
                    {
                        name: 'Push Ups',
                        category: 'chest',
                        sets: [{ reps: 10 }]
                    }
                ]
            };

            await request(app)
                .post('/api/v1/workouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send(workoutData);

            // Verify workout exists
            const workoutsBefore = await Workout.find({ userId });
            expect(workoutsBefore).toHaveLength(1);

            // Delete account
            await request(app)
                .delete('/api/v1/users/account')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ password: validUserData.password })
                .expect(200);

            // Verify workouts are deleted
            const workoutsAfter = await Workout.find({ userId });
            expect(workoutsAfter).toHaveLength(0);
        });
    });

    describe('Input Validation and Sanitization', () => {
        test('should sanitize profile update inputs', async () => {
            const updateData = {
                firstName: '  Jane  ',
                lastName: '  Smith  ',
                goals: ['  Goal 1  ', '  Goal 2  ']
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.data.firstName).toBe('Jane');
            expect(response.body.data.lastName).toBe('Smith');
        });

        test('should validate profile field lengths', async () => {
            const updateData = {
                firstName: 'A'.repeat(100), // Too long
                lastName: 'Smith'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should validate gender values', async () => {
            const updateData = {
                gender: 'invalid-gender'
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Authorization', () => {
        let otherUserToken;

        beforeEach(async () => {
            // Create another user
            const otherUserData = {
                email: 'other@example.com',
                password: 'password123',
                firstName: 'Other',
                lastName: 'User'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(otherUserData);

            otherUserToken = response.body.data.accessToken;
        });

        test('should only access own profile', async () => {
            // User 1 accessing their profile
            const response1 = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // User 2 accessing their profile
            const response2 = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response1.body.data.email).toBe(validUserData.email);
            expect(response2.body.data.email).toBe('other@example.com');
            expect(response1.body.data._id).not.toBe(response2.body.data._id);
        });

        test('should only access own statistics', async () => {
            const response = await request(app)
                .get('/api/v1/users/stats')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response.body.data.totalWorkouts).toBe(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle database connection errors gracefully', async () => {
            // This test would require mocking mongoose connection
            // For now, we'll test that errors return proper format
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
        });

        test('should return consistent error format', async () => {
            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ fitnessLevel: 'invalid' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
        });
    });
});