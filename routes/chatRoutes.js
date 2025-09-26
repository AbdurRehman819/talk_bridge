const router = require('express').Router();
const messageController = require('../controllers/messageController');
const {jwtAuthMiddleWare} = require('../middlewares/jwtAuth');
const mediaUpload = require('../middlewares/mediaUpload');


router.post('/messages', jwtAuthMiddleWare, messageController.sendMessage);

router.get('/messages/:userId', jwtAuthMiddleWare, messageController.getMessages);

router.post('/messages/media', mediaUpload.single('audio'), jwtAuthMiddleWare, messageController.handleMediaMessage);

module.exports = router;