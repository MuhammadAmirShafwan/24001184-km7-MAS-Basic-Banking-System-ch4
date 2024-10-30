const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountControllers');

router.post('/', accountController.createAccount);
router.get('/', accountController.getAllAccounts);
router.get('/:accountId', accountController.getAccountById);

module.exports = router;
