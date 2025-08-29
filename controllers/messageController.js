const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { translateText } = require('../services/translateService');


exports.sendMessage = async (req, res, next) => {
    try {
        const { sender, receiver, content } = req.body;
        if (!sender || !receiver || !content) {
            return res.status(400).json({ error: 'sender, receiver, and content are required' });
        }

        const receiverUser = await User.findById(receiver);
        const targetLang = receiverUser?.preferredLanguage || 'en';
        const translated = await translateText(content, targetLang);

        const message = await Message.create({
            sender,
            receiver,
            content,
            translatedContent: translated,
            sourceLang: 'auto',
            targetLang
        });

        const io = req.app.get('io');
        if (io) io.to(receiver.toString()).emit('message:new', message);

        res.status(201).json(message);
    } catch (err) {
        next(err);
    }
};



// Get paginated messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (Math.max(1, page) - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.receiverId },
                { sender: req.params.receiverId, receiver: req.user.id }
            ]
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Number(limit));

        res.status(200).json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get unread messages count from a specific sender
exports.unreadMessagesCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user.id,
            sender: req.params.senderId,
            read: false // matches your schema
        });

        res.status(200).json({ unread: count });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ message: 'Invalid message IDs' });
        }

        const result = await Message.updateMany(
            { _id: { $in: messageIds }, receiver: req.user.id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        res.json({ ok: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
