const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const AccountModel = require("./models/account");
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
app.use(express.json());

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

// ===================== API KEYS ENDPOINTS (GIỮ NGUYÊN) =====================
// Lưu ý: Phần này vẫn dùng MongoDB client cũ, bạn có thể tạo model cho API keys nếu muốn
// ===================== REPLICATE ENDPOINT =====================
// Endpoint mới: nhận file ảnh và prompt
app.post("/api/replicate-upload", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imageFile = req.file;

    if (!prompt || !imageFile) {
      return res.status(400).json({
        success: false,
        message: "Thiếu prompt hoặc file ảnh"
      });
    }

    // Đọc buffer file ảnh
    const imageBuffer = imageFile.buffer;

    // Gửi tới Replicate API (image-to-image)
    // Ví dụ với model 'stability-ai/stable-diffusion-img2img'
    const formData = new FormData();
    formData.append("version", "991ed12a2ef8ad7f09a86e73c0756f461fc2a824d4dbbe8b2f4b6d28857e1f5c"); // Thay bằng version model img2img
    formData.append("input", JSON.stringify({ prompt }));
    formData.append("image", imageBuffer, { filename: imageFile.originalname });

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: data.error || "Lỗi khi gọi Replicate img2img"
      });
    }
  } catch (err) {
    console.error("Replicate-upload error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gọi Replicate-upload"
    });
  }
});
app.post("/api/replicate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Thiếu prompt"
      });
    }

    // Gọi Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`, // 🔑 API key lấy từ .env
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "991ed12a2ef8ad7f09a86e73c0756f461fc2a824d4dbbe8b2f4b6d28857e1f5c", // Stable Diffusion model
        input: { prompt }
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: data.error || "Lỗi khi gọi Replicate"
      });
    }
  } catch (err) {
    console.error("Replicate error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gọi Replicate"
    });
  }
});

// Tạo MongoDB client riêng cho API keys collection
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
let apiDb;

// Connect to MongoDB for API keys
async function connectAPIDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    apiDb = client.db("WebAIGenInfinityDB");
    console.log("✅ API Database connected!");
  } catch (err) {
    console.error("❌ API DB connection error:", err);
  }
}

// Initialize API DB connection
connectAPIDB();

app.get("/api/keys", async (req, res) => {
  try {
    if (!apiDb) {
      return res.status(503).json({ error: "API Database not ready" });
    }
    const apiKeys = await apiDb.collection("api").find({}).toArray();
    res.json(apiKeys);
  } catch (err) {
    console.error("Get API keys error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/keys/:id", async (req, res) => {
  try {
    if (!apiDb) {
      return res.status(503).json({ error: "API Database not ready" });
    }
    const apiKey = await apiDb
      .collection("api")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!apiKey) return res.status(404).json({ error: "Key not found" });
    res.json(apiKey);
  } catch (err) {
    console.error("Get API key error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== HEALTH CHECK =====================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API đang hoạt động",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Có lỗi xảy ra!"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint không tồn tại"
  });
});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});