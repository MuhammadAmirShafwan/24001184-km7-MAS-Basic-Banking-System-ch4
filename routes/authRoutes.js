const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const restrictJwt = require("../middleware/restrictJwt");

router.get('/register', authControllers.renderRegister);
router.get('/login', authControllers.renderLogin);
router.post('/register', authControllers.handleRegister);
router.post('/login', authControllers.handleLogin);

router.use(restrictJwt);
router.get('/authenticated', authControllers.handleAuthenticated);

module.exports = router