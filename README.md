# Aura Social – Full Stack Social Media Platform

Aura Social is a full-stack social media application built using the MERN stack with real-time messaging support. The platform allows users to create accounts, share posts, interact through likes and comments, follow other users, and communicate via private messaging.

---

## 🚀 Features

### 🔐 Authentication & Security
- Secure user signup and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes using middleware

### 📸 Social Features
- Create and view posts
- Like / Unlike functionality
- Comment system with dynamic updates
- Follow / Unfollow users
- User profile navigation

### 🔎 Search
- Real-time user search
- Regex-based filtering for usernames and display names

### 💬 Real-Time Messaging
- Private Direct Messaging
- WebSocket integration using Socket.io
- Instant message delivery without page refresh

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Node.js
- Express.js
- RESTful API architecture
- Custom authentication middleware
- JWT (JSON Web Tokens)

### Database
- MongoDB (Primary)
- SQLite fallback (development mode)

### Real-Time
- Socket.io

---

## 🧠 Architecture Highlights

- RESTful API design
- Middleware-based request authentication
- Environment-based configuration
- Real-time event-driven communication

---

## ⚙️ Local Setup

### Prerequisites
- Node.js (v18+ recommended)

### Installation

1. Clone the repository:
   git clone https://github.com/YOUR_USERNAME/aura-social.git

2. Install dependencies:
   npm install

3. Create a `.env` file and add:

   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key

4. Start the development server:
   npm run dev

---

## 📌 Project Status

Active development. Continuously improving performance and scalability.

---

## 👨‍💻 Author

YOUR NAME  
MERN Stack Developer