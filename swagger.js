const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'My API',
        description: 'Deskripsi API',
    },
    host: 'localhost:3000',
    basePath: '/',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        { name: 'Auth' },
        { name: 'User' },
        { name: 'Account' },
        { name: 'Transaction' }
    ],

    definitions: {
        Register: {
            name: 'Muhammad Amir Shafwan',
            email: 'amirshafwan@gmail.com',
            password: 'amir631836'
        },
        Login: {
            email: 'amirshafwan@gmail.com',
            password: 'amir631836'
        },
        User: {
            name: 'Muhammad Amir Shafwan',
            email: 'user123@gmail.com',
            password: 'user123'
        },
        Profile: {
            identityType: 'SIM',
            identityNumber: '872163638746',
            address: 'JL. Kebon Jeruk, Jakarta'
        },
        AddUser: {
            name: 'Muhammad Amir Shafwan',
            email: 'amirshafwan@gmail.com',
            password: 'amir631836',
            profile: {
                identityType: 'SIM',
                identityNumber: '872163638746',
                address: 'JL. Kebon Jeruk, Jakarta'
            }
        },
        Account: {
            userId: '1',
            bankName: 'Bank BNI',
            bankAccountNumber: '123456789',
            balance: '1000000' || '0'
        },
        Transfer: {
            sourceAccountId: '1',
            destinationAccountId: '2',
            amount: '1000000'
        },
        Withdraw: {
            sourceAccountId: '1',
            amount: '1000000'
        },
        Deposit: {
            destinationAccountId: '1',
            amount: '1000000'
        }
    }
};

const outputFile = './swagger_output.json';

const endpointsFiles = ['./app.js']; // Masukkan file rute utama di sini

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./app.js'); // Jalankan aplikasi setelah dokumentasi dihasilkan
});
