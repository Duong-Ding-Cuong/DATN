const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const AccountModel = require("./models/account");
const ChatHistoryModel = require("./models/chatHistory");
const { ensureBucket, uploadBase64Image, uploadJsonObject, deleteImage } = require("./config/minio");
require("dotenv").config();
let fetch;
try {
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} catch (e) {
  console.error('node-fetch import failed:', e);
}
const multer = require("multer");
const upload = multer();

const app = express();
app.use(cors());
// Tăng giới hạn request body để chấp nhận ảnh base64 lớn (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Kết nối MongoDB với mongoose
const dbUri = process.env.MONGODB_URI;
let mongooseConnected = false;

if (!dbUri) {
  console.warn('⚠️  MONGODB_URI not set. Skipping DB connection — database features will be unavailable.');
} else {
  let triedFallback = false;
  const tryConnect = async (uri) => {
    try {
      await mongoose.connect(uri);
      mongooseConnected = true;
      console.log('✅ Database connected with Mongoose!');
      return true;
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      return false;
    }
  };

  // First try primary URI, then fallback to local MongoDB for developer convenience
  (async () => {
    const ok = await tryConnect(dbUri);
    if (!ok && !triedFallback) {
      triedFallback = true;
      const fallback = 'mongodb://127.0.0.1:27017/WebAIGenInfinityDB';
      console.warn('Attempting fallback local MongoDB at', fallback);
      const ok2 = await tryConnect(fallback);
      if (!ok2) {
        console.warn('Fallback local MongoDB also failed. The server will continue to run without DB.');
      }
    }
  })();

  // Keep track of connection status
  mongoose.connection.on('error', (err) => {
    mongooseConnected = false;
    console.error('Mongoose connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    mongooseConnected = false;
    console.warn('Mongoose disconnected');
  });
}


// ===================== AUTH ENDPOINTS =====================

// 1. POST /api/auth/register - Đăng ký tài khoản mới
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tất cả các trường đều là bắt buộc"
      });
    }

    // Check if email already exists
    const existingEmail = await AccountModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng"
      });
    }

    // Create new user
    const newUser = await AccountModel.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password: password // Trong thực tế nên hash password
    });

    // Remove password from response
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    };

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: { user: userResponse }
    });

  } catch (error) {
    console.error("Register error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field} đã được sử dụng`
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 2. POST /api/auth/login - Đăng nhập đơn giản
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và mật khẩu là bắt buộc"
      });
    }

    // Find user by email and password
    const user = await AccountModel.findOne({ 
      email: email.toLowerCase(),
      password: password // So sánh password trực tiếp (không an toàn, chỉ dùng cho demo)
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác"
      });
    }

    // Update last login (thêm field last_login vào schema nếu cần)
    await AccountModel.updateOne(
      { _id: user._id },
      { 
        $set: { 
          last_login: new Date()
        } 
      }
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login: new Date()
    };

    // Sign JWT token for the user (development fallback secret if not provided)
    const jwtSecret = process.env.JWT_SECRET || "dev-secret";
    let token = null;
    try {
      token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: "7d" }
      );
    } catch (e) {
      console.error("JWT sign error:", e);
    }

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: userResponse,
        token,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 3. GET /api/users - Lấy danh sách users
app.get("/api/users", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await AccountModel
      .find(query)
      .select('-password') // Exclude password field
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await AccountModel.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_users: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 4. GET /api/users/me - Lấy username của user hiện tại theo id
app.get("/api/users/me", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu id" 
      });
    }

    const user = await AccountModel.findById(id).select('username');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy user" 
      });
    }

    res.json({ 
      success: true, 
      data: { username: user.username } 
    });
  } catch (error) {
    console.error("Get user me error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});


// ===================== CHAT HISTORY ENDPOINTS =====================

// 1. POST /api/chat/history - Tạo đoạn chat mới
app.post("/api/chat/history", async (req, res) => {
  try {
    const { chatId, userId, title, chatType, firstMessage } = req.body;

    // Validate input
    if (!chatId || !userId || !title) {
      return res.status(400).json({
        success: false,
        message: "chatId, userId và title là bắt buộc"
      });
    }

    // Check if chatId already exists
    const existingChat = await ChatHistoryModel.findOne({ chatId });
    if (existingChat) {
      return res.status(409).json({
        success: false,
        message: "Chat ID đã tồn tại"
      });
    }

    // Tạo messages array với nội dung đầu tiên nếu có
    const messages = [];
    if (firstMessage) {
      messages.push({
        role: "user",
        content: firstMessage.content || firstMessage,
        metadata: firstMessage.metadata || { type: "text" }
      });
    }

    // Create new chat history
    const newChat = await ChatHistoryModel.create({
      chatId,
      userId,
      title,
      chatType: chatType || "text-to-text",
      messages
    });

    res.status(201).json({
      success: true,
      message: "Tạo đoạn chat thành công",
      data: newChat
    });

  } catch (error) {
    console.error("Create chat history error:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 2. POST /api/chat/history/:chatId/messages - Thêm message vào đoạn chat
app.post("/api/chat/history/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, content, metadata } = req.body;

    console.log("Adding message to chat:", {
      chatId,
      role,
      contentLength: content?.length,
      metadataKeys: metadata ? Object.keys(metadata) : [],
      metadataSize: JSON.stringify(metadata || {}).length
    });

    // Validate input
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: "role và content là bắt buộc"
      });
    }

    if (!["user", "assistant"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role phải là 'user' hoặc 'assistant'"
      });
    }

    // Find and update chat
    const chat = await ChatHistoryModel.findOneAndUpdate(
      { chatId },
      {
        $push: {
          messages: {
            role,
            content,
            metadata: metadata || { type: "text" },
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat"
      });
    }

    console.log("Message added successfully");

    res.status(200).json({
      success: true,
      message: "Thêm message thành công",
      data: chat
    });

  } catch (error) {
    console.error("Add message error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
      error: error.message
    });
  }
});

// 3. GET /api/chat/history/user/:userId - Lấy danh sách các đoạn chat của user
app.get("/api/chat/history/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, chatType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId };
    if (chatType) {
      query.chatType = chatType;
    }

    // Lấy danh sách chat, chỉ lấy thông tin cơ bản (không lấy toàn bộ messages)
    const chats = await ChatHistoryModel
      .find(query)
      .select('chatId title chatType createdAt updatedAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    const total = await ChatHistoryModel.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách chat thành công",
      data: chats,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_chats: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Get chat list error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 4. GET /api/chat/history/:chatId - Lấy chi tiết đoạn chat theo chatId
app.get("/api/chat/history/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await ChatHistoryModel.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat"
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết chat thành công",
      data: chat
    });

  } catch (error) {
    console.error("Get chat detail error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 5. PUT /api/chat/history/:chatId/title - Cập nhật title của đoạn chat
app.put("/api/chat/history/:chatId/title", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title không được để trống"
      });
    }

    const chat = await ChatHistoryModel.findOneAndUpdate(
      { chatId },
      { title: title.trim() },
      { new: true }
    ).select('chatId title chatType updatedAt');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat"
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật title thành công",
      data: chat
    });

  } catch (error) {
    console.error("Update chat title error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});

// 6. DELETE /api/chat/history/:chatId - Xóa đoạn chat
app.delete("/api/chat/history/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await ChatHistoryModel.findOneAndDelete({ chatId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat"
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa đoạn chat thành công",
      data: { chatId }
    });

  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
});


// ===================== MINIO IMAGE UPLOAD ENDPOINTS =====================

// POST /api/upload/image - Upload base64 image to MinIO
app.post("/api/upload/image", async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: "base64Data là bắt buộc"
      });
    }

    // Upload to MinIO
    const result = await uploadBase64Image(base64Data, fileName);

    res.status(200).json({
      success: true,
      message: "Upload ảnh thành công",
      data: {
        url: result.url,
        objectName: result.objectName
      }
    });

  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi upload ảnh",
      error: error.message
    });
  }
});

// DELETE /api/upload/image/:objectName - Delete image from MinIO
app.delete("/api/upload/image/:objectName", async (req, res) => {
  try {
    const { objectName } = req.params;

    await deleteImage(objectName);

    res.status(200).json({
      success: true,
      message: "Xóa ảnh thành công"
    });

  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa ảnh",
      error: error.message
    });
  }
});

// POST /api/upload/json - Upload JSON object to MinIO
app.post("/api/upload/json", async (req, res) => {
  try {
    const { jsonData, fileName } = req.body;

    if (!jsonData) {
      return res.status(400).json({
        success: false,
        message: "jsonData là bắt buộc"
      });
    }

    // Upload to MinIO
    const result = await uploadJsonObject(jsonData, fileName);

    res.status(200).json({
      success: true,
      message: "Upload JSON thành công",
      data: {
        url: result.url,
        objectName: result.objectName
      }
    });

  } catch (error) {
    console.error("Upload JSON error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi upload JSON",
      error: error.message
    });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Có lỗi xảy ra!"
  });
});

// 404 handler - PHẢI ĐẶT CUỐI CÙNG
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint không tồn tại"
  });
});

// ===================== END MINIO ENDPOINTS =====================

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize MinIO bucket
  await ensureBucket();
});