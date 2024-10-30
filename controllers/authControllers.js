require("dotenv").config();
const bcrypt = require("bcrypt")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const jwt = require("jsonwebtoken");
const { token } = require("morgan");
const jwtSecret = process.env.JWT_SECRET

exports.renderRegister = (req, res) => {
    /* 	#swagger.tags = ['Auth']
        #swagger.summary = 'Endpoint untuk halaman register'
        #swagger.description = 'endpoint untuk halaman register' */

    res.render('register');
}

exports.renderLogin = (req, res) => {
    /* 	#swagger.tags = ['Auth']
        #swagger.summary = 'Endpoint untuk halaman login'
        #swagger.description = 'endpoint untuk halaman login' */

    res.status(200).render('login');
}

exports.handleRegister = async (req, res) => {
    /* 	#swagger.tags = ['Auth']
        #swagger.summary = 'Endpoint untuk register user'
        #swagger.description = 'endpoint untuk register user' */

    /*	#swagger.parameters['obj'] = {
        in: 'body',
        description: 'Register information',
        required: true,
        schema: { 
            $ref: "#/definitions/Register"
        }
    } */

    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            throw { status: 400, message: "Input tidak valid" };
        }

        const cekEmailUnique = await prisma.user.findUnique({
            where: { email }
        });

        if (cekEmailUnique) {
            throw { status: 400, message: "Email sudah terdaftar" };
        }

        const passwordEncrypt = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

        await prisma.user.create({
            data: {
                name,
                email,
                password: passwordEncrypt
            }
        });

        res.status(200).json({
            success: true,
            message: "User berhasil dibuat"
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

exports.handleLogin = async (req, res) => {
    /* 	#swagger.tags = ['Auth']
        #swagger.summary = 'Endpoint untuk login'
        #swagger.description = 'endpoint untuk login' */

    /*	#swagger.parameters['obj'] = {
        in: 'body',
        description: 'User information',
        required: true,
        schema: {
            $ref: "#/definitions/Login"
        }
    } */

    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw { status: 404, message: "Email atau password salah" };
        } else {

            let isPassword = await bcrypt.compare(password, user.password);

            if (!isPassword) {
                throw { status: 400, message: "Email atau password salah" };
            } else {
                const accessToken = jwt.sign(
                    {
                        name: user.name,
                        email: user.email
                    }, jwtSecret, { expiresIn: "1d" }
                );

                res.cookie('token', accessToken, { httpOnly: true, secure: true });
                res.redirect('/api/v1/auth/authenticated');

                // res.status(200).json({
                //     success: true,
                //     message: "Berhasil login",
                //     accessToken
                // });
            }
        }

    } catch (error) {
        if (error) {
            return res.status(error.status).json({
                status: error.status,
                message: error.message
            });
        }
    }

}

exports.handleAuthenticated = (req, res) => {
    /* 	#swagger.tags = ['Auth']
        #swagger.summary = 'Endpoint untuk halaman authenticated'
        #swagger.description = 'endpoint untuk halaman authenticated' */


    res.status(200).json({
        success: true,
        message: "Berhasil login",
        token: req.cookies.token
    });
}


