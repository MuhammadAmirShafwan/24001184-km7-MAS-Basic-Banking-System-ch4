const bodyParser = require('body-parser');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
app.use(bodyParser.json());

app.post('/api/v1/users', async (req, res) => {
    const { name, email, password, profile } = req.body;
    const user = await prisma.user.create({
        data: {
            name, email, password,
            profile: {
                create: profile
            }
        }
    });
    res.json(user);
});

app.get('/api/v1/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json({
        status: 200,
        message: 'Get all users successfully',
        data: users
    });
});

app.get('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { profile: true }
    });
    res.json({
        status: 200,
        message: 'Get user successfully',
        data: user
    });
});

app.put('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, password } = req.body;
    const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { name, email, password }
    });
    res.json(user);
})

app.put('/api/v1/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { identityType, identityNumber, address } = req.body;
    const profile = await prisma.profile.update({
        where: { userId: parseInt(userId) },
        data: { identityType, identityNumber, address }
    });
    res.json(profile);
})

app.delete('/api/v1/users/:userId', async (req, res) => {
    try {
        const foundUser = await prisma.user.findUnique({
            where: { id: parseInt(req.params.userId) }
        });

        if (!foundUser) {
            return res.status(404).json({ error: "User tidak ada" });
        }

        await prisma.user.delete({
            where: { id: parseInt(req.params.userId) }
        });

        res.json({ message: "User berhasil di hapus " });
    } catch (error) {
        res.status(500).json({ error: "Operasi gagal" });
    }
});

app.delete('/api/v1/profiles/:profileId', async (req, res) => {
    try {
        const foundProfile = await prisma.profile.findUnique({
            where: { id: parseInt(req.params.profileId) }
        });

        if (!foundProfile) {
            return res.status(404).json({ error: "Profil tidak ada" });
        }

        await prisma.profile.delete({
            where: { id: parseInt(req.params.profileId) }
        });

        res.json({ message: "Profil berhasil di hapus" });
    } catch (error) {
        res.status(500).json({ error: "Operasi gagal" });
    }
});

app.post('/api/v1/accounts', async (req, res) => {
    const { userId, bankName, bankAccountNumber, balance } = req.body;
    const account = await prisma.bankAccount.create({
        data: {
            userId, bankName, bankAccountNumber, balance
        }
    });
    res.json(account);
});

app.get('/api/v1/accounts', async (req, res) => {
    const accounts = await prisma.bankAccount.findMany();
    res.json({
        status: 200,
        message: 'Data berhasil ditemukan',
        data: accounts
    });
});

app.get('/api/v1/accounts/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const account = await prisma.bankAccount.findUnique({
        where: { id: parseInt(accountId) },
        include: {
            user: true, // Opsional: jika ingin menampilkan informasi user pemilik akun
        },
    });

    if (!account) {
        return res.status(404).json({ error: "Akun tidak ditemukan" });
    }

    res.json({
        status: 200,
        message: 'Data berhasil ditemukan',
        data: account
    });
});


app.post('/api/v1/transactions/deposit', async (req, res) => {
    const { destinationAccountId, amount } = req.body;

    try {

        const destinationAccount = await prisma.bankAccount.findUnique({
            where: { id: destinationAccountId }
        });

        if (!destinationAccount) {
            throw new Error("Akun penerima tidak ditemukan");
        }

        await prisma.bankAccount.update({
            where: { id: destinationAccountId },
            data: {
                balance: destinationAccount.balance + amount
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                transactionType: "deposit",
                destinationAccountId,
                amount
            }
        });

        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/v1/transactions/withdraw', async (req, res) => {
    const { sourceAccountId, amount } = req.body;

    try {
        const sourceAccount = await prisma.bankAccount.findUnique({
            where: { id: sourceAccountId }
        });

        if (!sourceAccount) {
            throw new Error("Akun pengirim tidak ditemukan");
        }

        if (sourceAccount.balance < amount) {
            throw new Error("Saldo tidak mencukupi");
        }

        await prisma.bankAccount.update({
            where: { id: sourceAccountId },
            data: {
                balance: sourceAccount.balance - amount
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                transactionType: "withdraw",
                sourceAccountId,
                amount
            }
        });

        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/v1/transactions/transfer', async (req, res) => {
    const { sourceAccountId, destinationAccountId, amount } = req.body;

    try {

        if (sourceAccountId === destinationAccountId) {
            throw new Error("Transfer ke akun sendiri tidak diperbolehkan");
        }

        const transaction = await prisma.$transaction(async (prisma) => {
            const sourceAccount = await prisma.bankAccount.findUnique({
                where: { id: sourceAccountId }
            });

            const destinationAccount = await prisma.bankAccount.findUnique({
                where: { id: destinationAccountId }
            });

            if (!sourceAccount || !destinationAccount) {
                throw new Error("Akun tidak ditemukan");
            }

            if (sourceAccount.balance < amount) {
                throw new Error("Insufficient balance");
            }

            await prisma.bankAccount.update({
                where: { id: sourceAccountId },
                data: {
                    balance: sourceAccount.balance - amount
                }
            });

            await prisma.bankAccount.update({
                where: { id: destinationAccountId },
                data: {
                    balance: destinationAccount.balance + amount
                }
            });

            return await prisma.transaction.create({
                data: {
                    transactionType: "transfer",
                    sourceAccountId,
                    destinationAccountId,
                    amount
                }
            });
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/v1/transactions', async (req, res) => {
    const transactions = await prisma.transaction.findMany();
    res.json({
        status: 200,
        message: 'Data berhasil ditemukan',
        data: transactions
    });
});

app.get('/api/v1/transactions/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
            sourceAccount: true,
            destinationAccount: true
        },
    });

    if (!transaction) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    }

    res.json({
        status: 200,
        message: 'Data berhasil ditemukan',
        data: transaction
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
