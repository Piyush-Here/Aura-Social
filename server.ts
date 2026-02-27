import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from "http";
import Database from "better-sqlite3";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "aura-secret-key";
const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
    return uri;
  }
  return null; // Return null if no valid URI
};

const MONGODB_URI = getMongoUri();
mongoose.set('bufferCommands', false);
let isConnected = false;
let dbMode: 'mongodb' | 'sqlite' = 'sqlite';

// SQLite Setup
const sqlite = new Database('aura.db');
sqlite.pragma('journal_mode = WAL');

// Initialize SQLite Tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    image_url TEXT,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    post_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    post_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT,
    following_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    receiver_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// MongoDB Schemas (Keep for Atlas users)
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
  const PORT = 3000;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });

  // Database Initialization Logic
  const initDb = async () => {
    if (MONGODB_URI) {
      console.log("📡 Attempting to connect to MongoDB...");
      try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        dbMode = 'mongodb';
        console.log("✅ Connected to MongoDB successfully");
      } catch (err: any) {
        console.error("❌ MongoDB connection failed, falling back to SQLite:", err.message);
        dbMode = 'sqlite';
        isConnected = true;
      }
    } else {
      console.log("ℹ️ No MONGODB_URI found, using local SQLite database.");
      dbMode = 'sqlite';
      isConnected = true;
    }

    // Seed initial user if none exists
    if (dbMode === 'sqlite') {
      const user = sqlite.prepare('SELECT * FROM users LIMIT 1').get();
      if (!user) {
        console.log("🌱 Seeding SQLite with initial user...");
        const id = Math.random().toString(36).substr(2, 9);
        const hashedPassword = await bcrypt.hash("password123", 10);
        sqlite.prepare('INSERT INTO users (id, username, password, display_name, avatar_url, bio) VALUES (?, ?, ?, ?, ?, ?)').run(
          id, "alex_aura", hashedPassword, "Alex Aura", "https://picsum.photos/seed/alex/200/200", "Minimalist designer & photographer."
        );
        sqlite.prepare('INSERT INTO posts (id, user_id, image_url, caption) VALUES (?, ?, ?, ?)').run(
          Math.random().toString(36).substr(2, 9), id, "https://picsum.photos/seed/post1/1080/1080", "Morning light in the studio. #minimalism"
        );
        console.log("✅ SQLite seeded.");
      } else {
        console.log("ℹ️ SQLite already has data, skipping seed.");
      }
    } else {
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
        await Post.create({ user_id: firstUser._id, image_url: "https://picsum.photos/seed/post1/1080/1080", caption: "Morning light in the studio. #minimalism" });
        console.log("✅ MongoDB seeded.");
      }
    }
  };

  initDb();

  // Status Route
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: isConnected ? "connected" : "connecting",
      mode: dbMode,
      message: dbMode === 'sqlite' ? "Running on local SQLite (No Atlas URI found)" : "Connected to MongoDB Atlas"
    });
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    console.log(`Signup attempt: ${req.body?.username}`);
    if (!isConnected) return res.status(503).json({ error: "Database initializing..." });
    const { username, password, display_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      let user;
      if (dbMode === 'sqlite') {
        const existing = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (existing) return res.status(400).json({ error: "Username exists" });
        const id = Math.random().toString(36).substr(2, 9);
        sqlite.prepare('INSERT INTO users (id, username, password, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)').run(
          id, username, hashedPassword, display_name || username, `https://picsum.photos/seed/${username}/200/200`
        );
        user = { id, username, display_name: display_name || username, avatar_url: `https://picsum.photos/seed/${username}/200/200` };
      } else {
        const created = await User.create({ username, password: hashedPassword, display_name: display_name || username, avatar_url: `https://picsum.photos/seed/${username}/200/200` });
        user = { id: created._id, username: created.username, display_name: created.display_name, avatar_url: created.avatar_url };
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    console.log(`Login attempt: ${req.body?.username}`);
    if (!isConnected) return res.status(503).json({ error: "Database initializing..." });
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      let user: any;
      if (dbMode === 'sqlite') {
        user = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username);
      } else {
        user = await User.findOne({ username }).lean();
        if (user) user.id = user._id;
      }

      if (!user) {
        console.log(`Login failed: User ${username} not found`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.password) {
        console.error(`Critical: User ${username} found but has no password hash in database`);
        return res.status(500).json({ error: "Account configuration error. Please contact support." });
      }

      const isMatch = await bcrypt.compare(String(password), String(user.password));
      if (!isMatch) {
        console.log(`Login failed: Password mismatch for ${username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`Login success: ${username}`);
      const token = jwt.sign({ id: user.id || user._id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id || user._id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url } });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      let user: any;
      if (dbMode === 'sqlite') {
        user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      } else {
        user = await User.findById(req.user.id).lean();
        if (user) user.id = user._id;
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  // API Routes
  app.get("/api/posts", async (req, res) => {
    try {
      if (dbMode === 'sqlite') {
        const posts = sqlite.prepare(`
          SELECT posts.*, users.username, users.display_name, users.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments_count
          FROM posts JOIN users ON posts.user_id = users.id
          ORDER BY posts.created_at DESC
        `).all();
        res.json(posts);
      } else {
        const posts = await Post.find().populate('user_id').sort({ created_at: -1 }).lean();
        const enriched = await Promise.all(posts.map(async (p: any) => ({
          ...p, id: p._id, username: p.user_id.username, display_name: p.user_id.display_name, avatar_url: p.user_id.avatar_url,
          likes_count: await Like.countDocuments({ post_id: p._id }),
          comments_count: await Comment.countDocuments({ post_id: p._id })
        })));
        res.json(enriched);
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts", authenticateToken, async (req: any, res) => {
    const { image_url, caption } = req.body;
    try {
      if (dbMode === 'sqlite') {
        const id = Math.random().toString(36).substr(2, 9);
        sqlite.prepare('INSERT INTO posts (id, user_id, image_url, caption) VALUES (?, ?, ?, ?)').run(id, req.user.id, image_url, caption);
        res.json({ id });
      } else {
        const post = await Post.create({ user_id: req.user.id, image_url, caption });
        res.json({ id: post._id });
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts/:id/like", authenticateToken, async (req: any, res) => {
    const post_id = req.params.id;
    try {
      if (dbMode === 'sqlite') {
        const existing = sqlite.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, post_id);
        if (existing) {
          sqlite.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
          res.json({ unliked: true });
        } else {
          sqlite.prepare('INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)').run(Math.random().toString(36).substr(2, 9), req.user.id, post_id);
          res.json({ success: true });
        }
      } else {
        const existing = await Like.findOne({ user_id: req.user.id, post_id });
        if (existing) { await Like.deleteOne({ _id: existing._id }); res.json({ unliked: true }); }
        else { await Like.create({ user_id: req.user.id, post_id }); res.json({ success: true }); }
      }
    } catch (e) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      if (dbMode === 'sqlite') {
        const comments = sqlite.prepare('SELECT comments.*, users.username, users.avatar_url FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ?').all(req.params.id);
        res.json(comments);
      } else {
        const comments = await Comment.find({ post_id: req.params.id }).populate('user_id').lean();
        res.json(comments.map((c: any) => ({ ...c, id: c._id, username: c.user_id.username, avatar_url: c.user_id.avatar_url })));
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/posts/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      if (dbMode === 'sqlite') {
        sqlite.prepare('INSERT INTO comments (id, user_id, post_id, content) VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substr(2, 9), req.user.id, req.params.id, req.body.content);
      } else {
        await Comment.create({ user_id: req.user.id, post_id: req.params.id, content: req.body.content });
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/users/search", async (req, res) => {
    const { q } = req.query;
    try {
      if (dbMode === 'sqlite') {
        const users = sqlite.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE username LIKE ? OR display_name LIKE ?').all(`%${q}%`, `%${q}%`);
        res.json(users);
      } else {
        const users = await User.find({ $or: [{ username: { $regex: q as string, $options: 'i' } }, { display_name: { $regex: q as string, $options: 'i' } }] }).lean();
        res.json(users.map((u: any) => ({ ...u, id: u._id })));
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/messages/:userId", authenticateToken, async (req: any, res) => {
    const otherId = req.params.userId;
    try {
      if (dbMode === 'sqlite') {
        const msgs = sqlite.prepare('SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC').all(req.user.id, otherId, otherId, req.user.id);
        res.json(msgs);
      } else {
        const msgs = await Message.find({ $or: [{ sender_id: req.user.id, receiver_id: otherId }, { sender_id: otherId, receiver_id: req.user.id }] }).sort({ created_at: 1 }).lean();
        res.json(msgs);
      }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => socket.join(userId));
    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, content } = data;
      try {
        if (dbMode === 'sqlite') {
          const id = Math.random().toString(36).substr(2, 9);
          const msg = { id, sender_id, receiver_id, content, created_at: new Date().toISOString() };
          sqlite.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(id, sender_id, receiver_id, content);
          io.to(receiver_id).emit("receive_message", msg);
          io.to(sender_id).emit("message_sent", msg);
        } else {
          const msg = await Message.create({ sender_id, receiver_id, content });
          io.to(receiver_id).emit("receive_message", msg);
          io.to(sender_id).emit("message_sent", msg);
        }
      } catch (err) { console.error(err); }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }
}

startServer();
