const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const e = require('express');

exports.createUser = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk membuat user'
        #swagger.description = 'endpoint untuk membuat user' */

    /*	#swagger.parameters['obj'] = {
            in: 'body',
            description: 'User information.',
            required: true,
            schema: { 
                $ref: "#/definitions/AddUser"
            }
    } */

    try {
        const { name, email, password, profile } = req.body;

        if (!name || !email || !password || !profile) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const emailExists = await prisma.user.findUnique({
            where: { email }
        });

        if (emailExists) {
            throw { status: 400, message: 'Email sudah terdaftar' };
        }

        const passwordEncrypt = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordEncrypt,
                profile: {
                    create: profile
                }
            },
            include: {
                profile: true
            }
        });

        res.status(201).json({
            message: 'Data berhasil ditambahkan',
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

exports.getAllUsers = async (req, res) => {
    /*  #swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk mendapatkan user'
        #swagger.description = 'Endpoint untuk mendapatkan semua user' */

    try {
        const users = await prisma.user.findMany();

        if (users.length === 0) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }

        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: users
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

exports.getUserById = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk mendapatkan user'
        #swagger.description = 'endpoint untuk mendapatkan user berdasarkan id' */

    const { userId } = req.params;

    try {
        if (isNaN(userId)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { profile: true }
        });

        if (!user) {
            throw { status: 404, message: "Data tidak ditemukan" };
        }

        res.status(200).json({
            message: 'Data berhasil ditemukan',
            data: user
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};

exports.updateUser = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk update user'
        #swagger.description = 'Endpoint untuk update user berdasarkan ID' */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi pengguna yang akan diperbarui.',
        required: true,
        schema: { 
            $ref: "#/definitions/User" 
        }
    } */

    const { userId } = req.params;

    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password || isNaN(userId)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!userExists) {
            throw { status: 404, message: "User tidak ditemukan" };
        }

        const emailExists = await prisma.user.findUnique({
            where: { email }
        });

        if (emailExists && emailExists.id !== parseInt(userId)) {
            throw { status: 400, message: 'Email sudah terdaftar' };
        }

        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { name, email, password }
        });

        res.status(200).json({
            message: 'Data berhasil diperbarui',
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};

exports.updateUserProfile = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk update profile'
        #swagger.description = 'Endpoint untuk update profile berdasarkan User ID' */

    /*  #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Informasi profile pengguna yang akan diperbarui.',
        required: true,
        schema: { 
            $ref: "#/definitions/Profile" 
        }
    } */

    const { userId } = req.params;

    const { identityType, identityNumber, address } = req.body;

    try {
        if (!identityType || !identityNumber || !address || isNaN(userId) || isNaN(identityNumber)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!userExists) {
            throw { status: 404, message: "User tidak ditemukan" };
        }

        const profileExists = await prisma.profile.findUnique({
            where: { userId: parseInt(userId) }
        });

        if (!profileExists) {
            throw { status: 404, message: "Profile tidak ditemukan" };
        }

        const profile = await prisma.profile.update({
            where: { userId: parseInt(userId) },
            data: { identityType, identityNumber, address }
        });

        res.status(200).json({
            message: 'Data berhasil diperbarui',
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};

exports.deleteUser = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk menghapus user'
        #swagger.description = 'Endpoint untuk menghapus user berdasarkan ID' */

    const { userId } = req.params;

    try {

        if (isNaN(userId)) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!userExists) {
            throw { status: 404, message: "User tidak ditemukan" };
        }

        await prisma.user.delete({
            where: { id: parseInt(userId) }
        });

        res.status(200).json({
            message: 'Data berhasil dihapus'
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }
};

exports.deleteUserProfile = async (req, res) => {
    /* 	#swagger.tags = ['User']
        #swagger.summary = 'Endpoint untuk menghapus profile'
        #swagger.description = 'Endpoint untuk menghapus profile berdasarkan ID' */

    const { userId } = req.params;

    try {
        if (isNaN(userId)) {
            throw { status: 400, message: "Input tidak valid" };//
        }

        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!userExists) {
            throw { status: 404, message: "User tidak ditemukan" };//
        }

        const profileExists = await prisma.profile.findUnique({
            where: { userId: parseInt(userId) }
        });

        if (!profileExists) {
            throw { status: 404, message: "Profile tidak ditemukan" };//
        }

        await prisma.profile.delete({
            where: { userId: parseInt(userId) }
        });

        res.status(200).json({
            message: 'Data berhasil dihapus'
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