const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User', 
       required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Original text content
    content: { type: String, required: true },

    // Phase 4 additions
    translatedContent: { type: String },   // translated message text
    sourceLang: { type: String },          // detected source language ( "en")
    targetLang: { type: String },          // receiver’s preferred language ( "ur")

    // Delivery/read status
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    read: { type: Boolean, default: false },
    readAt: { type: Date },

    // Timestamp
    timeStamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
