const router = require('express').Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/login', userController.login);
router.post('/forget-password', userController.forgetPassword);
router.post('/reset-password/:token', userController.resetPassword);

module.exports = router;