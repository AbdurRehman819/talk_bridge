const jwt = require('jsonwebtoken');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { translateText } = require('../services/translateService'); // ADD THIS

const onlineUsers = new Map(); // userId -> [socketIds]

function socketHandler(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token provided'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add socket to user's list
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, []);
    }
    onlineUsers.get(socket.userId).push(socket.id);

    // Send undelivered messages
    const undelivered = await Message.find({
      receiver: socket.userId,
      delivered: false
    });
    for (let msg of undelivered) {
      socket.emit('privateMessage', {
        from: msg.sender,
        message: msg,
        timestamp: msg.timestamp
      });
    }
    await Message.updateMany(
      { receiver: socket.userId, delivered: false },
      { $set: { delivered: true, deliveredAt: new Date() } }
    );

    
    socket.on('privateMessage', async ({ to, message }) => {
      if (!to || !message) return;

      try {
        // Fetch receiver's language
        const receiverUser = await User.findById(to);
        const targetLang = receiverUser?.preferredLanguage || 'en';

        // Translate message text
        const translated = await translateText(message, targetLang);

        // Save message
        const newMessage = new Message({
          sender: socket.userId,
          receiver: to,
          content: message,
          translatedContent: translated, // <-- ADDED
          sourceLang: 'auto',
          targetLang,
          delivered: false,
          read: false
        });
        await newMessage.save();

        // Send to receiver if online
        const receiverSockets = onlineUsers.get(to);
        if (receiverSockets && receiverSockets.length > 0) {
          for (const sid of receiverSockets) {
            io.to(sid).emit('privateMessage', {
              from: socket.userId,
              message: newMessage,
              timestamp: newMessage.timestamp
            });
          }

          // Mark as delivered
          await Message.findByIdAndUpdate(newMessage._id, {
            delivered: true,
            deliveredAt: new Date()
          });

          socket.emit('messageDelivered', { messageId: newMessage._id });
        }
      } catch (err) {
        console.error('Error sending message:', err.message);
      }
    });
    

    socket.on('markRead', async ({ messageIds }) => {
      if (!Array.isArray(messageIds)) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: socket.userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );

      const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      for (let msg of updatedMessages) {
        const senderSockets = onlineUsers.get(msg.sender.toString());
        if (senderSockets) {
          for (const sid of senderSockets) {
            io.to(sid).emit('messageRead', { messageId: msg._id });
          }
        }
      }
    });

    socket.on('typing', ({ to }) => {
      const receiverSockets = onlineUsers.get(to);
      if (receiverSockets) {
        for (const sid of receiverSockets) {
          io.to(sid).emit('typing', { from: socket.userId });
        }
      }
    });

    socket.on('stopTyping', ({ to }) => {
      const receiverSockets = onlineUsers.get(to);
      if (receiverSockets) {
        for (const sid of receiverSockets) {
          io.to(sid).emit('stopTyping', { from: socket.userId });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      const sockets = onlineUsers.get(socket.userId) || [];
      onlineUsers.set(socket.userId, sockets.filter(id => id !== socket.id));
      if (onlineUsers.get(socket.userId).length === 0) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
}

module.exports = socketHandler;
