const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.deposit = async (req, res) => {
    /** #swagger.tags = ['Transaction']
     * #swagger.summary = 'Endpoint untuk melakukan deposit'
     * #swagger.description = 'Endpoint untuk melakukan deposit ke akun'
     */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi transaksi deposit.',
        required: true,
        schema: {
            $ref: "#/definitions/Deposit"
        }
    } */

    const { destinationAccountId, amount } = req.body;

    try {
        if (!destinationAccountId || !amount || amount <= 0 || isNaN(destinationAccountId) || isNaN(amount)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const destinationAccount = await prisma.bankAccount.findUnique({
            where: { id: parseInt(destinationAccountId) }
        });

        if (!destinationAccount) {
            throw { status: 404, message: "Akun tidak ditemukan" };
        }

        await prisma.bankAccount.update({
            where: { id: parseInt(destinationAccountId) },
            data: {
                balance: destinationAccount.balance + parseFloat(amount)
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                transactionType: "deposit",
                destinationAccountId: parseInt(destinationAccountId),
                amount: parseFloat(amount)
            }
        });

        delete transaction.sourceAccountId;
        res.status(201).json({
            message: "Deposit berhasil",
            data: transaction
        });

    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};

exports.withdraw = async (req, res) => {
    /** #swagger.tags = ['Transaction']
     * #swagger.summary = 'Endpoint untuk melakukan withdraw'
     * #swagger.description = 'Endpoint untuk melakukan withdraw dari akun'
     */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi transaksi penarikan.',
        required: true,
        schema: {
            $ref: "#/definitions/Withdraw"
        }
    } */

    const { sourceAccountId, amount } = req.body;

    try {
        if (!sourceAccountId || !amount || amount <= 0 || isNaN(amount) || isNaN(sourceAccountId)) {
            throw { status: 400, message: "Input tidak valid" };
        }
        const sourceAccount = await prisma.bankAccount.findUnique({
            where: { id: parseInt(sourceAccountId) }
        });

        if (!sourceAccount) {
            throw { status: 404, message: "Akun tidak ditemukan" };
        }

        if (sourceAccount.balance < parseFloat(amount)) {
            throw { status: 400, message: "Saldo tidak cukup" };
        }

        await prisma.bankAccount.update({
            where: { id: parseInt(sourceAccountId) },
            data: {
                balance: sourceAccount.balance - parseFloat(amount)
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                transactionType: "withdraw",
                sourceAccountId: parseInt(sourceAccountId),
                amount: parseFloat(amount)
            }
        });

        delete transaction.destinationAccountId;
        res.status(201).json({
            message: "Withdraw berhasil",
            transaction
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

exports.transfer = async (req, res) => {
    /** #swagger.tags = ['Transaction']
     * #swagger.summary = 'Endpoint untuk melakukan transfer'
     * #swagger.description = 'Endpoint untuk melakukan transfer antar akun'
     */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi transaksi transfer.',
        required: true,
        schema: {
            $ref: "#/definitions/Transfer"
        }
    } */

    const { sourceAccountId, destinationAccountId, amount } = req.body;

    try {
        if (sourceAccountId === destinationAccountId || !sourceAccountId || !destinationAccountId || !amount || amount <= 0 || isNaN(sourceAccountId) || isNaN(destinationAccountId) || isNaN(amount)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const sourceAccount = await prisma.bankAccount.findUnique({
            where: { id: parseInt(sourceAccountId) }
        });

        const destinationAccount = await prisma.bankAccount.findUnique({
            where: { id: parseInt(destinationAccountId) }
        });

        if (!destinationAccount || !sourceAccount) {
            throw { status: 404, message: "Akun tidak ditemukan" };
        }

        if (sourceAccount.balance < parseFloat(amount)) {
            throw { status: 400, message: "Saldo tidak cukup" };
        }

        await prisma.bankAccount.update({
            where: { id: parseInt(sourceAccountId) },
            data: {
                balance: sourceAccount.balance - parseFloat(amount)
            }
        });

        await prisma.bankAccount.update({
            where: { id: parseInt(destinationAccountId) },
            data: {
                balance: destinationAccount.balance + parseFloat(amount)
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                transactionType: "transfer",
                sourceAccountId: parseInt(sourceAccountId),
                destinationAccountId: parseInt(destinationAccountId),
                amount: parseFloat(amount)
            }
        });

        res.status(201).json({
            message: "Transfer berhasil",
            transaction
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

exports.getAllTransactions = async (req, res) => {
    /*  #swagger.tags = ['Transaction']
        #swagger.summary = 'Endpoint untuk mendapatkan transaksi'
        #swagger.description = 'Endpoint untuk mendapatkan semua transaksi' */

    try {
        const transactions = await prisma.transaction.findMany();

        if (transactions.length === 0) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }

        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: transactions
        });
    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};


exports.getTransactionById = async (req, res) => {
    /*  #swagger.tags = ['Transaction']
        #swagger.summary = 'Endpoint untuk mendapatkan transaksi'
        #swagger.description = 'Endpoint untuk mendapatkan transaksi berdasarkan ID' */

    const { transactionId } = req.params;

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(transactionId) },
            include: {
                sourceAccount: true,
                destinationAccount: true
            },
        });

        if (!transaction) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }

        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: transaction
        });

    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};
