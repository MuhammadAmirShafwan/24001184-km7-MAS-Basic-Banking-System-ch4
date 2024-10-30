const request = require('supertest');
const { app, server } = require('../app.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Auth', () => {
    beforeAll(async () => {
        await prisma.user.deleteMany();
        await prisma.bankAccount.deleteMany();
        await prisma.transaction.deleteMany();
    })

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });

    const random = Math.random().toString(36);
    const data = {
        name: 'Test User',
        email: `${random}@gmail.com`,
        password: 'testpassword',
    }

    test('Succes test untuk GET /api/v1/auth/login', async () => {
        const response = await request(app).get('/api/v1/auth/login');
        expect(response.statusCode).toBe(200);
    });

    test('Succes test untuk GET /api/v1/auth/register', async () => {
        const response = await request(app).get('/api/v1/auth/register');
        expect(response.statusCode).toBe(200);
    });

    test('Succes test untuk POST /api/v1/auth/register', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send(data);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'User berhasil dibuat');
    });

    test('Failed test untuk POST /api/v1/auth/register', async () => {
        const userExists = await prisma.user.findFirst()
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: userExists.name,
                email: userExists.email,
                password: userExists.password,
            });
        expect(response.body).toHaveProperty('message', 'Email sudah terdaftar');
        expect(response.statusCode).toBe(400);
    });

    test('Failed test untuk POST /api/v1/auth/register', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: '',
                email: '',
                password: '',
            });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Succes test untuk POST /api/v1/auth/login', async () => {

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send(data);
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/api/v1/auth/authenticated');
    });

    test('Failed test untuk POST /api/v1/auth/login', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'salah@gmail.com',
                password: 'salahpassword',
            });
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Email atau password salah');
    });

    test('Failed test untuk POST /api/v1/auth/login', async () => {
        const userExists = await prisma.user.findFirst();
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: `${userExists.email}`,
                password: 'salahpassword',
            });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email atau password salah');
    });

    test('Succes test untuk GET /api/v1/auth/authenticated', async () => {
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send(data);

        expect(loginResponse.statusCode).toBe(302);
        expect(loginResponse.headers['set-cookie']).toBeDefined();

        // console.log(loginResponse.headers);
        const cookies = loginResponse.headers['set-cookie'];

        const authResponse = await request(app)
            .get('/api/v1/auth/authenticated')
            .set('Cookie', cookies);

        expect(authResponse.statusCode).toBe(200);
        expect(authResponse.body).toHaveProperty('message', 'Berhasil login');
    });

    test('Failed test untuk GET /api/v1/auth/authenticated', async () => {
        const response = await request(app)
            .get('/api/v1/auth/authenticated');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    test('Failed test untuk GET /api/v1/auth/authenticated', async () => {
        const token = 'invalidToken';
        const response = await request(app)
            .get('/api/v1/auth/authenticated')
            .set('Cookie', `token=${token}`);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

});