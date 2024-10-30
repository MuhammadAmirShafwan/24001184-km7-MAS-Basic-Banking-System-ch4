const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
router.put('/:userId/profile', userController.updateUserProfile);
router.delete('/:userId', userController.deleteUser);
router.delete('/:userId/profile', userController.deleteUserProfile);

module.exports = router;
