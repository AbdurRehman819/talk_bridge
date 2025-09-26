const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { translateText } = require("../services/translateService");

const onlineUsers = new Map(); // userId -> [socketIds]

function socketHandler(io) {
  // ========================
  // 📌 Authentication
  // ========================
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Track online users
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, []);
    }
    onlineUsers.get(socket.userId).push(socket.id);

    // ========================
    // 📌 Deliver Undelivered Messages
    // ========================
    const undelivered = await Message.find({
      receiver: socket.userId,
      delivered: false,
    });

    for (let msg of undelivered) {
      socket.emit("privateMessage", {
        from: msg.sender,
        message: msg,
        timestamp: msg.timestamp,
      });
    }

    await Message.updateMany(
      { receiver: socket.userId, delivered: false },
      { $set: { delivered: true, deliveredAt: new Date() } }
    );

    // ========================
    // 📌 Private Message Handler
    // ========================
    socket.on("privateMessage", async (data) => {
      const {
        to,
        message, // text or optional caption
        messageType, // "text" | "audio" | "image" | "video"
        fileUrl, // for audio/image/video
        transcription,
        mediaMeta, // { mimeType, size, duration, etc. }
      } = data;

      if (!to) return;

      try {
        const receiverUser = await User.findById(to);
        const targetLang = receiverUser?.preferredLanguage || "en";

        let newMessage;

        if (messageType === "text") {
          // 📝 Text
          const translated = await translateText(message, targetLang);

          newMessage = new Message({
            sender: socket.userId,
            receiver: to,
            content: message,
            translatedContent: translated,
            sourceLang: "auto",
            targetLang,
            messageType,
            delivered: false,
            read: false,
          });
        } else if (messageType === "audio") {
          // 🎤 Audio
          const translated = transcription
            ? await translateText(transcription, targetLang)
            : "";

          newMessage = new Message({
            sender: socket.userId,
            receiver: to,
            fileUrl,
            transcription,
            translatedContent: translated,
            content: translated || transcription,
            messageType,
            delivered: false,
            read: false,
            mediaMeta,
          });
        } else if (messageType === "image" || messageType === "video") {
          // 🖼️ Image / 🎥 Video
          newMessage = new Message({
            sender: socket.userId,
            receiver: to,
            content: message || "", // optional caption
            fileUrl,
            messageType,
            delivered: false,
            read: false,
            mediaMeta,
          });
        }

        // Save
        await newMessage.save();

        // Send to receiver if online
        const receiverSockets = onlineUsers.get(to);
        if (receiverSockets?.length > 0) {
          for (let sid of receiverSockets) {
            io.to(sid).emit("privateMessage", {
              from: socket.userId,
              message: newMessage,
              timestamp: newMessage.timestamp,
            });
          }

          // Mark as delivered
          await Message.findByIdAndUpdate(newMessage._id, {
            delivered: true,
            deliveredAt: new Date(),
          });

          socket.emit("messageDelivered", { messageId: newMessage._id });
        }
      } catch (err) {
        console.error("❌ Error sending message:", err.message);
      }
    });

    // ========================
    // 📌 Mark Read
    // ========================
    socket.on("markRead", async ({ messageIds }) => {
      if (!Array.isArray(messageIds)) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: socket.userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );

      const updatedMessages = await Message.find({ _id: { $in: messageIds } });

      for (let msg of updatedMessages) {
        const senderSockets = onlineUsers.get(msg.sender.toString());
        if (senderSockets) {
          for (let sid of senderSockets) {
            io.to(sid).emit("messageRead", { messageId: msg._id });
          }
        }
      }
    });

    // ========================
    // 📌 Typing Indicators
    // ========================
    socket.on("typing", ({ to }) => {
      const receiverSockets = onlineUsers.get(to);
      if (receiverSockets) {
        for (let sid of receiverSockets) {
          io.to(sid).emit("typing", { from: socket.userId });
        }
      }
    });

    socket.on("stopTyping", ({ to }) => {
      const receiverSockets = onlineUsers.get(to);
      if (receiverSockets) {
        for (let sid of receiverSockets) {
          io.to(sid).emit("stopTyping", { from: socket.userId });
        }
      }
    });

    // ========================
    // 📌 Disconnect
    // ========================
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      const sockets = onlineUsers.get(socket.userId) || [];
      const filtered = sockets.filter((id) => id !== socket.id);
      if (filtered.length > 0) {
        onlineUsers.set(socket.userId, filtered);
      } else {
        onlineUsers.delete(socket.userId);
      }
    });
  });
}

module.exports = socketHandler;
