const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Metadata linh hoạt cho các loại content đặc biệt
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: { type: "text" }
  }
});

const chatHistorySchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  // Loại chat: text-to-text, create-image, create-game, file-to-text, etc.
  chatType: {
    type: String,
    enum: [
      "text-to-text",
      "file-to-text", 
      "create-image",
      "handle-image",
      "increase-resolution",
      "background-separation",
      "image-compression",
      "create-game"
    ],
    default: "text-to-text"
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Tự động cập nhật updatedAt khi có thay đổi
chatHistorySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Tự động cập nhật updatedAt khi update
chatHistorySchema.pre("findOneAndUpdate", function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const ChatHistoryModel = mongoose.model("ChatHistory", chatHistorySchema);

module.exports = ChatHistoryModel;
