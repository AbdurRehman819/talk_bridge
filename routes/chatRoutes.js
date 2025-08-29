const router = require('express').Router();
const messageController = require('../controllers/messageController');
const {jwtAuthMiddleWare} = require('../middlewares/jwtAuth');



router.post('/messages', jwtAuthMiddleWare, messageController.sendMessage);

router.get('/messages/:userId', jwtAuthMiddleWare, messageController.getMessages);


module.exports = router;