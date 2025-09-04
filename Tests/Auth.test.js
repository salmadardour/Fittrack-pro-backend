const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../App');
const User = require('../Models/User');

// Test database configuration
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/fittrack-test';

describe('Authentication Endpoints', () => {
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
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/v1/auth/register', () => {
        const validUserData = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe'
        };

        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.user.email).toBe(validUserData.email);
            expect(response.body.data.user.firstName).toBe(validUserData.firstName);
            expect(response.body.data.user.lastName).toBe(validUserData.lastName);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
        });

        test('should not register user with invalid email', async () => {
            const invalidData = { ...validUserData, email: 'invalid-email' };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not register user with short password', async () => {
            const invalidData = { ...validUserData, password: '123' };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not register user with missing required fields', async () => {
            const invalidData = { email: 'test@example.com' };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not register user with duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(201);

            // Second registration with same email
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        });

        test('should hash password before saving', async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(201);

            const user = await User.findOne({ email: validUserData.email }).select('+password');
            expect(user.password).not.toBe(validUserData.password);
            expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
        });
    });

    describe('POST /api/v1/auth/login', () => {
        const validUserData = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe'
        };

        beforeEach(async () => {
            // Create a user for login tests
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData);
        });

        test('should login user with valid credentials', async () => {
            const loginData = {
                email: validUserData.email,
                password: validUserData.password
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user.email).toBe(validUserData.email);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
            expect(response.body.data.user.lastLogin).toBeDefined();
        });

        test('should not login with invalid email', async () => {
            const loginData = {
                email: 'wrong@example.com',
                password: validUserData.password
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        test('should not login with invalid password', async () => {
            const loginData = {
                email: validUserData.email,
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        test('should not login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUserData.email })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should not login inactive user', async () => {
            // Deactivate user
            await User.findOneAndUpdate(
                { email: validUserData.email },
                { isActive: false }
            );

            const loginData = {
                email: validUserData.email,
                password: validUserData.password
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        test('should update lastLogin on successful login', async () => {
            const loginData = {
                email: validUserData.email,
                password: validUserData.password
            };

            const beforeLogin = await User.findOne({ email: validUserData.email });
            const beforeLoginTime = beforeLogin.lastLogin;

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

            await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            const afterLogin = await User.findOne({ email: validUserData.email });
            expect(afterLogin.lastLogin.getTime()).toBeGreaterThan(
                beforeLoginTime ? beforeLoginTime.getTime() : 0
            );
        });
    });

    describe('Authentication Middleware', () => {
        let userToken;
        const validUserData = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe'
        };

        beforeEach(async () => {
            // Register and login to get token
            const registerResponse = await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData);

            userToken = registerResponse.body.data.accessToken;
        });

        test('should access protected route with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(validUserData.email);
        });

        test('should not access protected route without token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        test('should not access protected route with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TOKEN_ERROR');
        });

        test('should not access protected route with malformed Authorization header', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });

    describe('Input Validation', () => {
        test('should validate email format', async () => {
            const invalidEmails = [
                'invalid-email',
                'invalid@',
                '@invalid.com',
                'invalid.com',
                ''
            ];

            for (const email of invalidEmails) {
                const response = await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        email,
                        password: 'password123',
                        firstName: 'John',
                        lastName: 'Doe'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }
        });

        test('should sanitize input data', async () => {
            const userData = {
                email: '  test@example.com  ',
                password: 'password123',
                firstName: '  John  ',
                lastName: '  Doe  '
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.firstName).toBe('John');
            expect(response.body.data.user.lastName).toBe('Doe');
        });
    });

    describe('Rate Limiting', () => {
        test('should apply rate limiting to auth endpoints', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            // Make multiple failed login attempts
            const promises = Array(10).fill().map(() =>
                request(app)
                    .post('/api/v1/auth/login')
                    .send(userData)
            );

            const responses = await Promise.all(promises);

            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
});