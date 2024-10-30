const request = require('supertest');
const { app, server } = require('../app.js'); // sesuaikan dengan path file app.js Anda
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Users', () => {
    beforeAll(async () => {
        await prisma.user.deleteMany();
        await prisma.bankAccount.deleteMany();

    });

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });

    test('Failed test untuk endpoint GET /api/v1/accounts', async () => {
        const response = await request(app).get('/api/v1/accounts');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    });

    test('Success test untuk endpoint POST /api/v1/accounts', async () => {
        const random = Math.random().toString(36);
        const createUser = {
            name: 'John Doe',
            email: `${random}@gmail.com`,
            password: 'createUser123',
            profile: {
                identityType: 'KTP',
                identityNumber: '123456789',
                address: '123 Main St'
            }
        }
        await request(app)
            .post('/api/v1/users')
            .send(createUser);

        const user = await prisma.user.findFirst();
        let randomBankNumber = Math.floor(1000000000 + Math.random() * 9999999999);
        const data = {
            userId: `${user.id}`,
            bankName: 'Bank BNI',
            bankAccountNumber: `${randomBankNumber}`,
            balance: '1000000'
        }

        const response = await request(app)
            .post('/api/v1/accounts')
            .send(data);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Akun bank berhasil dibuat');
    })

    test('Failed test untuk endpoint POST /api/v1/accounts', async () => {
        const data = {
            userId: '',
            bankName: 'Bank BNI',
            bankAccountNumber: `1234567890`,
            balance: '1000000'
        }

        const response = await request(app)
            .post('/api/v1/accounts')
            .send(data);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    })

    test('Failed test untuk endpoint POST /api/v1/accounts', async () => {
        const data = {
            userId: '00',
            bankName: 'Bank BNI',
            bankAccountNumber: `1234567890`,
            balance: '1000000'
        }

        const response = await request(app)
            .post('/api/v1/accounts')
            .send(data);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'User tidak ditemukan');
    })

    test('Failed test untuk endpoint POST /api/v1/accounts', async () => {
        const bankAccountExist = await prisma.bankAccount.findFirst();

        const response = await request(app)
            .post('/api/v1/accounts')
            .send(bankAccountExist);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Akun sudah ada');
    })

    test('Success test untuk endpoint GET /api/v1/accounts', async () => {
        const response = await request(app).get('/api/v1/accounts');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
        expect(response.body.data).toBeInstanceOf(Array);
    })

    test('Success test untuk endpoint GET /api/v1/accounts/:id', async () => {
        const bankAccount = await prisma.bankAccount.findFirst();

        const response = await request(app).get(`/api/v1/accounts/${bankAccount.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
        expect(response.body.data).toHaveProperty('id', bankAccount.id);
    })

    test('Failed test untuk endpoint GET /api/v1/accounts/:id', async () => {
        const response = await request(app).get('/api/v1/accounts/100000');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    })

    test('Failed test untuk endpoint GET /api/v1/accounts/:id', async () => {
        const response = await request(app).get('/api/v1/accounts/kkkk');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });
});