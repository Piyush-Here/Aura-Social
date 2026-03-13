import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from "http";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "aura-secret-key";
const MONGODB_URI = process.env.MONGODB_URI;

// Disable buffering so we get immediate errors if not connected
mongoose.set('bufferCommands', false);

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  display_name: String,
  avatar_url: String,
  bio: String,
  created_at: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image_url: { type: String, required: true },
  caption: String,
  created_at: { type: Date, default: Date.now }
});

const likeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  created_at: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const followSchema = new mongoose.Schema({
  follower_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Like = mongoose.model('Like', likeSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);
const Message = mongoose.model('Message', messageSchema);

// Middleware
const checkDbConnection = (req: any, res: any, next: any) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: "Database not connected", 
      message: "The server is not connected to MongoDB. Please check your MONGODB_URI." 
    });
  }
  next();
};

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(express.json());
  app.use("/api", checkDbConnection);
  const PORT = 3000;

  // Database Connection Logic
  if (MONGODB_URI) {
    console.log("📡 Attempting to connect to MongoDB...");
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("✅ Connected to MongoDB Atlas");
    } catch (err: any) {
      console.error("❌ MongoDB connection failed:", err.message);
    }
  } else {
    console.warn("⚠️ MONGODB_URI is not defined. Database features will be unavailable.");
  }

  // Seed initial user if none exists
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("🌱 Seeding MongoDB with initial user...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      const firstUser = await User.create({
        username: "alex_aura",
        password: hashedPassword,
        display_name: "Alex Aura",
        avatar_url: "https://picsum.photos/seed/alex/200/200",
        bio: "Minimalist designer & photographer."
      });
      await Post.create({ 
        user_id: firstUser._id, 
        image_url: "https://picsum.photos/seed/post1/1080/1080", 
        caption: "Morning light in the studio. #minimalism" 
      });
      console.log("✅ MongoDB seeded.");
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }

  // Status Route
  app.get("/api/status", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({ 
      status: isConnected ? "connected" : "disconnected",
      mode: "mongodb",
      message: isConnected ? "Connected to MongoDB Atlas" : "MongoDB connection failed or missing"
    });
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { username, password, display_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const created = await User.create({ 
        username, 
        password: hashedPassword, 
        display_name: display_name || username, 
        avatar_url: `https://picsum.photos/seed/${username}/200/200` 
      });
      const user = { id: created._id, username: created.username, display_name: created.display_name, avatar_url: created.avatar_url };
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

    try {
      const user: any = await User.findOne({ username }).lean();
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(String(password), String(user.password));
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
      res.json({ 
        token, 
        user: { id: user._id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url } 
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user: any = await User.findById(req.user.id).lean();
      if (user) user.id = user._id;
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.put("/api/users/me", authenticateToken, async (req: any, res) => {
    const { display_name, avatar_url, bio } = req.body;
    try {
      await User.findByIdAndUpdate(req.user.id, { display_name, avatar_url, bio });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  // API Routes
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await Post.find().populate('user_id').sort({ created_at: -1 }).lean();
      const enriched = await Promise.all(posts.map(async (p: any) => ({
        ...p, 
        id: p._id, 
        username: p.user_id.username, 
        display_name: p.user_id.display_name, 
        avatar_url: p.user_id.avatar_url,
        likes_count: await Like.countDocuments({ post_id: p._id }),
        comments_count: await Comment.countDocuments({ post_id: p._id })
      })));
      res.json(enriched);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts", authenticateToken, async (req: any, res) => {
    const { image_url, caption } = req.body;
    try {
      const post = await Post.create({ user_id: req.user.id, image_url, caption });
      res.json({ id: post._id });
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts/:id/like", authenticateToken, async (req: any, res) => {
    const post_id = req.params.id;
    try {
      const existing = await Like.findOne({ user_id: req.user.id, post_id });
      if (existing) { 
        await Like.deleteOne({ _id: existing._id }); 
        res.json({ unliked: true }); 
      } else { 
        await Like.create({ user_id: req.user.id, post_id }); 
        res.json({ success: true }); 
      }
    } catch (e) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await Comment.find({ post_id: req.params.id }).populate('user_id').lean();
      res.json(comments.map((c: any) => ({ 
        ...c, 
        id: c._id, 
        username: c.user_id.username, 
        avatar_url: c.user_id.avatar_url 
      })));
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      await Comment.create({ user_id: req.user.id, post_id: req.params.id, content: req.body.content });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/users/search", async (req, res) => {
    const { q } = req.query;
    try {
      const users = await User.find({ 
        $or: [
          { username: { $regex: q as string, $options: 'i' } }, 
          { display_name: { $regex: q as string, $options: 'i' } }
        ] 
      }).lean();
      res.json(users.map((u: any) => ({ ...u, id: u._id })));
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/messages/:userId", authenticateToken, async (req: any, res) => {
    const otherId = req.params.userId;
    try {
      const msgs = await Message.find({ 
        $or: [
          { sender_id: req.user.id, receiver_id: otherId }, 
          { sender_id: otherId, receiver_id: req.user.id }
        ] 
      }).sort({ created_at: 1 }).lean();
      res.json(msgs);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/users/:id/follow", authenticateToken, async (req: any, res) => {
    const following_id = req.params.id;
    if (req.user.id === following_id) return res.status(400).json({ error: "Cannot follow yourself" });
    try {
      const existing = await Follow.findOne({ follower_id: req.user.id, following_id });
      if (existing) {
        await Follow.deleteOne({ _id: existing._id });
        res.json({ unfollowed: true });
      } else {
        await Follow.create({ follower_id: req.user.id, following_id });
        res.json({ success: true });
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const u = await User.findById(req.params.id).lean();
      let user: any = null;
      if (u) {
        user = {
          ...u,
          id: u._id,
          followers_count: await Follow.countDocuments({ following_id: u._id }),
          following_count: await Follow.countDocuments({ follower_id: u._id }),
          posts_count: await Post.countDocuments({ user_id: u._id }),
          is_following: await Follow.countDocuments({ follower_id: req.user.id, following_id: u._id })
        };
      }
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json(user);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/users/:id/posts", async (req, res) => {
    try {
      const posts = await Post.find({ user_id: req.params.id }).sort({ created_at: -1 }).lean();
      res.json(posts.map((p: any) => ({ ...p, id: p._id })));
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => socket.join(userId));
    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, content } = data;
      try {
        const msg = await Message.create({ sender_id, receiver_id, content });
        io.to(receiver_id).emit("receive_message", msg);
        io.to(sender_id).emit("message_sent", msg);
      } catch (err) { console.error(err); }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: "spa",
      root: path.resolve(process.cwd(), "client")
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
}

startServer();
