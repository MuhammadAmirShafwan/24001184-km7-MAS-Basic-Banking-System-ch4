const request = require('supertest');
const { app, server } = require('../app.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Account', () => {
    beforeAll(async () => {
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });

    test('Failed test untuk endpoint GET /api/v1/users', async () => {
        const response = await request(app).get('/api/v1/users');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    })

    test('Success test untuk endpoint POST /api/v1/users', async () => {
        const random = Math.random().toString(36);

        const data = {
            name: 'John Doe',
            email: `${random}.mail.com`,
            password: 'password123',
            profile: {
                identityType: 'KTP',
                identityNumber: '123456789',
                address: '123 Main St'
            }
        }

        const response = await request(app).post('/api/v1/users')
            .send(data);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditambahkan');
    });

    test('Failed test untuk endpoint POST /api/v1/users', async () => {
        const data = {
            name: '',
            email: '',
            password: ''
        };
        const response = await request(app)
            .post('/api/v1/users')
            .send(data);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    })

    test('Failed test untuk endpoint POST /api/v1/users', async () => {
        const emailExists = await prisma.user.findFirst();
        // console.log(emailExists, 'email exists');
        const data = {
            name: 'John Doe',
            email: `${emailExists.email}`,
            password: 'password123',
            profile: {
                identityType: 'KTP',
                identityNumber: '123456789',
                address: '123 Main St'
            }
        }
        // console.log(data, 'data');
        const response = await request(app)
            .post('/api/v1/users')
            .send(data);
        // console.log(response.body, 'response');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email sudah terdaftar');
    });

    test('Success test untuk endpoint GET /api/v1/users', async () => {
        const response = await request(app).get('/api/v1/users');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
    })

    test('Success test untuk endpoint GET /api/v1/users/:id', async () => {
        const userExists = await prisma.user.findFirst();
        const response = await request(app).get(`/api/v1/users/${userExists.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil ditemukan');
    });

    test('Failed test untuk endpoint GET /api/v1/users/:id', async () => {
        const response = await request(app).get('/api/v1/users/0');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Data tidak ditemukan');
    });

    test('Failed test untuk endpoint GET /api/v1/users/:id', async () => {
        const response = await request(app).get('/api/v1/users/a');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Success test untuk endpoint PUT /api/v1/users/:id', async () => {
        const random = Math.random().toString(36);
        const updatedData = {
            name: 'Updated User',
            email: `${random}@gmail.com`,
            password: 'updatedpassword',
        };

        const userExists = await prisma.user.findFirst();

        const response = await request(app)
            .put(`/api/v1/users/${userExists.id}`)
            .send(updatedData);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil diperbarui');

    });

    test('Failed test untuk endpoint PUT /api/v1/users/:id', async () => {
        await request(app).post('/api/v1/users')
            .send({
                name: 'John Doe',
                email: `asdhf@mail.com`,
                password: 'password123',
                profile: {
                    identityType: 'KTP',
                    identityNumber: '123456789',
                    address: '123 Main St'
                }
            })

        const userExists = await prisma.user.findMany({ take: 2 });

        const [user1, user2] = userExists;
        const updatedData = {
            name: 'Updated User',
            email: user2.email,
            password: 'updatedpassword',
        };

        const response = await request(app)
            .put(`/api/v1/users/${user1.id}`)
            .send(updatedData);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email sudah terdaftar');
    });

    test('Failed test untuk endpoint PUT /api/v1/users/:id', async () => {
        const updatedData = {
            name: 'Updated User',
            email: 'updateduser@gmail.com',
            password: 'updatedpassword',
        };

        const response = await request(app)
            .put(`/api/v1/users/0`)
            .send(updatedData);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'User tidak ditemukan');
    });

    test('Failed test untuk endpoint PUT /api/v1/users/:id', async () => {
        const updatedData = {
            name: 'Updated User',
            email: 'updateduser@gmail.com',
            password: 'updatedpassword',
        };

        const response = await request(app)
            .put(`/api/v1/users/a`)
            .send(updatedData);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Success test untuk endpoint PUT /api/v1/:userId/profile', async () => {
        const updatedData = {
            identityType: 'SIM',
            identityNumber: '987654321',
            address: 'Updated Address',
        };

        const userProfileExists = await prisma.profile.findFirst();

        const response = await request(app)
            .put(`/api/v1/users/${userProfileExists.userId}/profile`)
            .send(updatedData);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil diperbarui');
    });

    test('Failed test untuk endpoint PUT /api/v1/:userId/profile', async () => {
        const userProfile = await prisma.profile.findFirst();

        const updatedData = {
            identityType: 'sim',
            identityNumber: 'aaa',
            address: 'Updated Address',
        };
        const response = await request(app)
            .put(`/api/v1/users/${userProfile.userId}/profile`)
            .send(updatedData);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    })

    test('Failed test untuk endpoint PUT /api/v1/:userId/profile', async () => {
        const updatedData = {
            identityType: 'SIM',
            identityNumber: '987654321',
            address: 'Updated Address',
        };

        const response = await request(app)
            .put(`/api/v1/users/0/profile`)
            .send(updatedData);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'User tidak ditemukan');
    })

    test('Failed test untuk endpoint DELETE /api/v1/users/:userId/profile', async () => {
        const response = await request(app).delete(`/api/v1/users/a/profile`);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    });

    test('Failed test untuk endpoint DELETE /api/v1/users/:userId/profile', async () => {
        const response = await request(app).delete(`/api/v1/users/0/profile`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'User tidak ditemukan');
    });

    test('Success test untuk endpoint DELETE /api/v1/users/:userId/profile', async () => {
        const userProfile = await prisma.profile.findFirst();

        const response = await request(app).delete(`/api/v1/users/${userProfile.userId}/profile`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil dihapus');
    })

    test('Failed test untuk endpoint DELETE /api/v1/:userId/profile', async () => {
        const usersWithoutProfile = await prisma.user.findMany({
            include: {
                profile: true
            },
            where: {
                profile: {
                    is: null
                }
            }
        });
        const response = await request(app).delete(`/api/v1/users/${usersWithoutProfile[0].id}/profile`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Profile tidak ditemukan');
    });

    test('Failed test untuk endpoint PUT /api/v1/:userId/profile', async () => {
        const updatedData = {
            identityType: 'SIM',
            identityNumber: '987654321',
            address: 'Updated Address',
        };

        const usersWithoutProfile = await prisma.user.findMany({
            include: {
                profile: true
            },
            where: {
                profile: {
                    is: null
                }
            }
        });
        // console.log(usersWithoutProfile)
        const response = await request(app)
            .put(`/api/v1/users/${usersWithoutProfile[0].id}/profile`)
            .send(updatedData);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Profile tidak ditemukan');
    })

    test('Failed test untuk endpoint DELETE /api/v1/users/:id', async () => {
        const response = await request(app).delete('/api/v1/users/a');

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Input tidak valid');
    })

    test('Failed test untuk endpoint DELETE /api/v1/users/:id', async () => {
        const response = await request(app).delete('/api/v1/users/0');

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'User tidak ditemukan');
    })

    test('Success test untuk endpoint DELETE /api/v1/users/:id', async () => {
        const userId = await prisma.user.findFirst();
        const response = await request(app).delete(`/api/v1/users/${userId.id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Data berhasil dihapus');

    });




});
