const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { translateText } = require('../services/translateService');
const axios = require('axios');
const { transcribeAudio } = require('../services/speachService');

exports.sendMessage = async (req, res, next) => {
  try {
    const { sender, receiver, content } = req.body;

    if (!sender || !receiver || !content) {
      return res.status(400).json({ error: "sender, receiver, and content are required" });
    }

  
    const senderLang = req.user?.preferredLanguage || "en-US";
    const receiverUser = await User.findById(receiver);
    const targetLang = receiverUser?.preferredLanguage || "en-US";

    // Translate
    const translated = await translateText(content, targetLang, senderLang);

  
    const message = await Message.create({
      sender,
      receiver,
      content,
      messageType: "text", 
      translatedContent: translated,
      sourceLang: senderLang,
      targetLang,
      mediaUrl: null,     
      mediaMeta: null,
    });

    
    const io = req.app.get("io");
    if (io) io.to(receiver.toString()).emit("message:new", message);

    res.status(201).json({ success: true, message });
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


const fs = require('fs');
const uploadToS3 = require("../utils/uploadsS3");

exports.handleMediaMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { receiver } = req.body;
    const file = req.file;

    // Upload to S3
    const fileUrl = await uploadToS3(file);

    const receiverUser = await User.findById(receiver);
    const targetLang = receiverUser?.preferredLanguage || "en-US";

    const senderId = req.user.id;
    const senderUser = await User.findById(senderId);
    const senderLang = senderUser?.preferredLanguage || "en-US";

    let messageData = {
      sender: senderId,
      receiver,
      messageType: "text", // will update below
      content: "",
      mediaUrl: null,
      mediaMeta: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };

    // 🖼 Image
    if (file.mimetype.startsWith("image/")) {
      messageData.messageType = "image";
      messageData.mediaUrl = fileUrl;
      messageData.content = "[Image]";
    }

    // 🎥 Video
    else if (file.mimetype.startsWith("video/")) {
      messageData.messageType = "video";
      messageData.mediaUrl = fileUrl;
      messageData.content = "[Video]";
    }

    // 🎤 Audio
    else if (file.mimetype.startsWith("audio/")) {
      messageData.messageType = "audio";
      messageData.mediaUrl = fileUrl;

      // Transcribe + Translate
      const transcription = await transcribeAudio(file.buffer, file.mimetype, senderLang); 
      const translated = await translateText(transcription, targetLang);

      messageData.transcription = transcription;
      messageData.translatedContent = translated;
      messageData.sourceLang = senderLang;
      messageData.targetLang = targetLang;
      messageData.content = translated || transcription;
    }

    const message = new Message(messageData);
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error("Media processing error:", error);
    res.status(500).json({ error: "Failed to process media" });
  }
};
