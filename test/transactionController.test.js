const request = require('supertest');
const { app, server } = require('../app.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Transaction', () => {
    beforeAll(async () => {
        await prisma.user.deleteMany();
        await prisma.bankAccount.deleteMany();
        await prisma.transaction.deleteMany();
    })

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });

    test('Failed test untuk endpoint GET /api/v1/transactions', async () => {
        const response = await request(app).get('/api/v1/transactions');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    });

    test('Succes test untuk endpoint POST /api/v1/transactions/deposit', async () => {
        await request(app)
            .post('/api/v1/users')
            .send({
                name: 'Test User',
                email: 'test@gmail.com',
                password: 'testpassword',
                profile: {
                    identityType: 'KTP',
                    identityNumber: '123456789',
                    address: '123 Main St'
                }
            });
        const user = await prisma.user.findFirst();
        await request(app)
            .post('/api/v1/accounts')
            .send({
                userId: `${user.id}`,
                bankName: 'Bank BNI',
                bankAccountNumber: '123456789',
                balance: '100000'
            })
        const bankAccount = await prisma.bankAccount.findFirst();

        const data = {
            destinationAccountId: `${bankAccount.id}`,
            amount: '100000',
        }

        const response = await request(app)
            .post('/api/v1/transactions/deposit')
            .send(data);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Deposit berhasil');
    })

    test('Failed test untuk endpoint POST /api/v1/transactions/deposit', async () => {
        const bankAccount = await prisma.bankAccount.findFirst();
        const data = {
            destinationAccountId: `${bankAccount.id}`,
            amount: 'seratus juta',
        }
        const response = await request(app)
            .post('/api/v1/transactions/deposit')
            .send(data);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/deposit', async () => {
        const response = await request(app)
            .post('/api/v1/transactions/deposit')
            .send({
                destinationAccountId: '00',
                amount: '100000',
            });
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Akun tidak ditemukan');
    });

    test('Succes test untuk endpoint POST /api/v1/transactions/withdraw', async () => {
        const bankAccount = await prisma.bankAccount.findFirst({
            where: {
                balance: {
                    gt: 0
                }
            }
        });

        const data = {
            sourceAccountId: `${bankAccount.id}`,
            amount: `${bankAccount.balance * 0.1}`,
        }

        const response = await request(app)
            .post('/api/v1/transactions/withdraw')
            .send(data);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Withdraw berhasil');
    })

    test('Failed test untuk endpoint POST /api/v1/transactions/withdraw', async () => {
        const response = await request(app)
            .post('/api/v1/transactions/withdraw')
            .send({
                sourceAccountId: '',
                amount: '0',
            })
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/withdraw', async () => {
        const data = {
            sourceAccountId: '00',
            amount: '100000',
        }

        const response = await request(app)
            .post('/api/v1/transactions/withdraw')
            .send(data);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Akun tidak ditemukan');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/withdraw', async () => {
        const bankAccount = await prisma.bankAccount.findFirst()
        const data = {
            sourceAccountId: `${bankAccount.id}`,
            amount: `${bankAccount.balance * 2}`,
        }

        const response = await request(app)
            .post('/api/v1/transactions/withdraw')
            .send(data);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Saldo tidak cukup');
    });

    test('Succes test untuk endpoint POST /api/v1/transactions/transfer', async () => {
        const user = await prisma.user.findFirst();
        await request(app)
            .post('/api/v1/accounts')
            .send({
                userId: `${user.id}`,
                bankName: 'Bank BNI',
                bankAccountNumber: '1111222333',
                balance: '100000'
            })
        const sourceAccount = await prisma.bankAccount.findFirst({
            where: {
                balance: {
                    gt: 0
                }
            }
        });

        const destinationAccount = await prisma.bankAccount.findFirst({
            where: {
                id: {
                    not: sourceAccount.id
                }
            }
        });

        const data = {
            sourceAccountId: `${sourceAccount.id}`,
            destinationAccountId: `${destinationAccount.id}`,
            amount: `${sourceAccount.balance * 0.1}`,
        }

        const response = await request(app)
            .post('/api/v1/transactions/transfer')
            .send(data);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Transfer berhasil');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/transfer', async () => {
        const response = await request(app)
            .post('/api/v1/transactions/transfer')
            .send({
                sourceAccountId: '',
                destinationAccountId: '',
                amount: '',
            })
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/transfer', async () => {
        const bankAccountExist = await prisma.bankAccount.findFirst();
        const response = await request(app)
            .post('/api/v1/transactions/transfer')
            .send({
                sourceAccountId: '00',
                destinationAccountId: `${bankAccountExist.id}`,
                amount: `${bankAccountExist.balance * 0.1}`,
            })
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Akun tidak ditemukan');
    });

    test('Failed test untuk endpoint POST /api/v1/transactions/transfer', async () => {
        const sourceAccount = await prisma.bankAccount.findFirst();
        const destinationAccount = await prisma.bankAccount.findFirst({
            where: {
                id: {
                    not: sourceAccount.id
                }
            }
        });

        const data = {
            sourceAccountId: `${sourceAccount.id}`,
            destinationAccountId: `${destinationAccount.id}`,
            amount: `${sourceAccount.balance * 2}`,
        }

        const response = await request(app)
            .post('/api/v1/transactions/transfer')
            .send(data);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Saldo tidak cukup');
    });

    test('Succes test untuk endpoint GET /api/v1/transactions', async () => {
        const response = await request(app).get('/api/v1/transactions');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
        expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Succes test untuk endpoint GET /api/v1/transactions/:id', async () => {
        const transaction = await prisma.transaction.findFirst();
        const response = await request(app).get(`/api/v1/transactions/${transaction.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
    });

    test('Failed test untuk endpoint GET /api/v1/transactions/:id', async () => {
        const response = await request(app).get('/api/v1/transactions/0');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    });







});