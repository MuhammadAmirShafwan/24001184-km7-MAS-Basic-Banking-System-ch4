const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionControllers');

router.post('/deposit', transactionController.deposit);
router.post('/withdraw', transactionController.withdraw);
router.post('/transfer', transactionController.transfer);
router.get('/', transactionController.getAllTransactions);
router.get('/:transactionId', transactionController.getTransactionById);

module.exports = router;
