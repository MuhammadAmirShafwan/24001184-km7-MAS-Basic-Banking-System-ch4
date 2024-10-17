const bodyParser = require('body-parser');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
app.use(bodyParser.json());

// create user and profile
// {
//     "name": "Muhammad Amir Shafwan",
//     "email": "muhammad.amir@mail.com",
//     "password": "password123",
//     "profile": {
//         "identityType": "KTP",
//         "identityNumber": "512545156753157",
//         "address": "Jln. Nasi Padang No. 1"
//     }
// }

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

// get all users
app.get('/api/v1/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

// get user by id and include profile
app.get('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { profile: true }
    });
    res.json(user);
});

// update user
app.put('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, password } = req.body;
    const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { name, email, password }
    });
    res.json(user);
})

// update profile
app.put('/api/v1/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { identityType, identityNumber, address } = req.body;
    const profile = await prisma.profile.update({
        where: { userId: parseInt(userId) },
        data: { identityType, identityNumber, address }
    });
    res.json(profile);
})

// create account
// {
//     "userId": 1, 
//     "bankName": "Bank ABC",
//     "bankAccountNumber": "1234567890",
//     "balance": 1000000.00
// }

app.post('/api/v1/accounts', async (req, res) => {
    const { userId, bankName, bankAccountNumber, balance } = req.body;
    const account = await prisma.bankAccount.create({
        data: {
            userId, bankName, bankAccountNumber, balance
        }
    });
    res.json(account);
});

// get all accounts
app.get('/api/v1/accounts', async (req, res) => {
    const accounts = await prisma.bankAccount.findMany();
    res.json(accounts);
});

// get account by id
app.get('/api/v1/accounts/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const account = await prisma.bankAccount.findUnique({
        where: { id: parseInt(accountId) },
        include: {
            user: true, // Opsional: jika ingin menampilkan informasi user pemilik akun
        },
    });

    if (!account) {
        return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
});


app.post('/api/v1/transactions/deposit', async (req, res) => {
    const { destinationAccountId, amount } = req.body;

    try {

        // pastikan akun penerima ada
        const destinationAccount = await prisma.bankAccount.findUnique({
            where: { id: destinationAccountId }
        });

        if (!destinationAccount) {
            throw new Error("Destination account not found");
        }

        // tambahkan saldo ke akun penerima
        await prisma.bankAccount.update({
            where: { id: destinationAccountId },
            data: {
                balance: destinationAccount.balance + amount
            }
        });

        // buat transaksi baru
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
        // pastikan akun ada
        const sourceAccount = await prisma.bankAccount.findUnique({
            where: { id: sourceAccountId }
        });

        if (!sourceAccount) {
            throw new Error("Source account not found");
        }

        // pastikan saldo cukup
        if (sourceAccount.balance < amount) {
            throw new Error("Insufficient balance");
        }

        // kurangi saldo
        await prisma.bankAccount.update({
            where: { id: sourceAccountId },
            data: {
                balance: sourceAccount.balance - amount
            }
        });

        // buat transaksi baru
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

        // Pastikan akun pengirim dan penerima berbeda
        if (sourceAccountId === destinationAccountId) {
            throw new Error("Source and destination account cannot be the same");
        }

        // Memulai transaksi di Prisma
        const transaction = await prisma.$transaction(async (prisma) => {
            // Ambil data akun pengirim dan penerima
            const sourceAccount = await prisma.bankAccount.findUnique({
                where: { id: sourceAccountId }
            });

            const destinationAccount = await prisma.bankAccount.findUnique({
                where: { id: destinationAccountId }
            });

            // Pastikan akun pengirim dan penerima ada
            if (!sourceAccount || !destinationAccount) {
                throw new Error("Source or destination account not found");
            }

            // Pastikan saldo akun pengirim cukup
            if (sourceAccount.balance < amount) {
                throw new Error("Insufficient balance");
            }

            // Kurangi saldo dari akun pengirim
            await prisma.bankAccount.update({
                where: { id: sourceAccountId },
                data: {
                    balance: sourceAccount.balance - amount
                }
            });

            // Tambahkan saldo ke akun penerima
            await prisma.bankAccount.update({
                where: { id: destinationAccountId },
                data: {
                    balance: destinationAccount.balance + amount
                }
            });

            // Buat transaksi baru
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


// get all transactions
app.get('/api/v1/transactions', async (req, res) => {
    const transactions = await prisma.transaction.findMany();
    res.json(transactions);
});

// get transaction by id
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
        return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
});

// delete user
app.delete('/api/v1/users/:userId', async (req, res) => {
    try {
        // Pastikan user ada
        const foundUser = await prisma.user.findUnique({
            where: { id: parseInt(req.params.userId) }
        });

        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Hapus pengguna
        await prisma.user.delete({
            where: { id: parseInt(req.params.userId) }
        });

        // Kirimkan respons sukses
        res.json({ message: "User successfully deleted" });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while deleting the user" });
    }
});

// delete profile
app.delete('/api/v1/profiles/:profileId', async (req, res) => {
    try {
        // Pastikan profile ada
        const foundProfile = await prisma.profile.findUnique({
            where: { id: parseInt(req.params.profileId) }
        });

        if (!foundProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Hapus profile
        await prisma.profile.delete({
            where: { id: parseInt(req.params.profileId) }
        });

        // Kirimkan respons sukses
        res.json({ message: "Profile successfully deleted" });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while deleting the profile" });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
