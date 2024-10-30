const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAccount = async (req, res) => {
    /* 	#swagger.tags = ['Account']
       #swagger.summary = 'Endpoint untuk membuat akun'
       #swagger.description = 'Endpoint untuk membuat akun baru' */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi akun yang akan ditambahkan.',
        required: true,
        schema: { 
            $ref: "#/definitions/Account" 
        }
    } */

    const { userId, bankName, bankAccountNumber, balance } = req.body;

    try {
        if (!userId || !bankName || !bankAccountNumber || isNaN(bankAccountNumber)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(userId)
            }
        });

        if (!user) {
            throw { status: 404, message: "User tidak ditemukan" };
        }

        const bankAccount = await prisma.bankAccount.findUnique({
            where: {
                bankAccountNumber: bankAccountNumber
            }
        });

        if (bankAccount) {
            throw { status: 400, message: "Akun sudah ada" };
        }

        const account = await prisma.bankAccount.create({
            data: {
                userId: parseInt(userId),
                bankName,
                bankAccountNumber,
                balance: parseFloat(balance),
            },
        });

        res.status(201).json({
            message: 'Akun bank berhasil dibuat',
            account
        });
    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
}

exports.getAllAccounts = async (req, res) => {
    /* 	#swagger.tags = ['Account']
        #swagger.summary = 'Endpoint untuk mendapatkan akun'
        #swagger.description = 'Endpoint untuk mendapatkan semua akun' */

    try {
        const accounts = await prisma.bankAccount.findMany();

        if (accounts.length === 0) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }

        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: accounts
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
}

exports.getAccountById = async (req, res) => {
    /* 	#swagger.tags = ['Account']
        #swagger.summary = 'Endpoint untuk mendapatkan akun'
        #swagger.description = 'Endpoint untuk mendapatkan akun berdasarkan ID' */

    const { accountId } = req.params;

    if (isNaN(accountId)) {
        return res.status(400).json({
            message: 'Input tidak valid'
        });
    }

    try {
        const account = await prisma.bankAccount.findUnique({
            where: { id: parseInt(accountId) },
            include: {
                // user: true
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        if (!account) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }
        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: account
        });
    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
}