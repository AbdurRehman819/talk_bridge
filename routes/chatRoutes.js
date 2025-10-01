const router = require('express').Router();
const messageController = require('../controllers/messageController');
const { jwtAuthMiddleWare } = require('../middlewares/jwtAuth');
const mediaUpload = require('../middlewares/mediaUpload');

// ✅ Specific GET routes first
router.get('/messages/history', jwtAuthMiddleWare, messageController.getPaginatedMessages);
router.get('/messages/conversation', jwtAuthMiddleWare, messageController.getConversation);

// ✅ Then media and send
router.post('/messages/media', mediaUpload.single('audio'), jwtAuthMiddleWare, messageController.handleMediaMessage);

// ✅ Parameterized routes (should be last)
router.get('/messages/:userId', jwtAuthMiddleWare, messageController.getMessages);
router.post('/messages', jwtAuthMiddleWare, messageController.sendMessage);

module.exports = router;
