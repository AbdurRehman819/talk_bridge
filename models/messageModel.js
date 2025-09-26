const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: { type: String },

    
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      required: true,
      default: "text",
    },

    mediaUrl: { type: String }, // S3 URL (image, video, or audio)
    mediaMeta: {
      fileName: String,
      mimeType: String,
      size: Number, // in bytes
    },

    
    transcription: { type: String }, // extracted text from audio

    // Phase 4 (Translation)
    translatedContent: { type: String }, // translated text
    sourceLang: { type: String }, // detected source language ( "en")
    targetLang: { type: String }, // receiver’s preferred language ( "ur")

    // Delivery/read status
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    read: { type: Boolean, default: false },
    readAt: { type: Date },

    // Timestamp
    timeStamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
