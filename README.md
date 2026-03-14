⚠️ Note: This project was initially scaffolded with AI assistance. 
The codebase was then reviewed, understood, and extended manually.

# Aura Social

Aura Social is a **full-stack social media web application** that allows users to create posts, interact with other users, and send real-time messages.

This project was initially scaffolded with the assistance of AI tools to accelerate development, but the codebase has been **reviewed, understood, and extended manually**. The goal of the project was to explore modern full-stack architecture using **React, Node.js, TypeScript, and MongoDB**.

---

# About This Project

This project was built as a **learning and experimentation project** to understand how modern social media platforms work internally.

AI tools were used to help generate an initial structure and accelerate development. However:

- The codebase was **fully reviewed and understood**
- Features were **tested and debugged manually**
- The project structure and functionality were **modified and extended**

The purpose of including this note is to **maintain transparency about AI usage while demonstrating the ability to work with and understand complex codebases.**

---

# Features

### Authentication
- User signup and login
- Secure password hashing with bcrypt
- JWT based authentication
- Persistent login support

### Social Feed
- Create posts with captions
- View posts from other users
- Like posts
- Dynamic feed updates

### Profiles
- User profile pages
- Display name and avatar
- Bio section
- User post history

### Search
- Search for users
- Navigate directly to profiles

### Direct Messaging
- Real-time messaging
- Socket.IO based communication
- User-to-user conversations

### UI / UX
- Responsive layout
- Toast notifications
- Modal based interactions
- Clean component structure

---

# Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- CSS Modules

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO

### Database
- MongoDB (via Mongoose)

### Authentication
- JSON Web Tokens (JWT)
- bcrypt

---

# Project Structure
aura-social
│
├── client
│ ├── src
│ │ ├── components
│ │ ├── pages
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── types.ts
│ │
│ └── index.html
│
├── server
│ └── server.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts


---

# Environment Variables

Create a `.env` file using `.env.example`.

Example configuration:

APP_URL=http://localhost:5173

JWT_SECRET=your_secret_key
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_api_key


---

# Installation

Clone the repository:
git clone https://github.com/yourusername/Aura-social.git

cd aura-social


Install dependencies: npm install


---

# Running The Project

Development mode:
npm run dev


Production build:
npm run build
npm run preview


Available scripts:
npm run dev
npm run build
npm run preview
npm run start
npm run lint


---

# API Overview

### Authentication
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me


### Posts
GET /api/posts
POST /api/posts
POST /api/posts/:id/like


### Users
GET /api/users/search
GET /api/users/:id


### Messages
GET /api/messages/:userId
POST /api/messages


Real-time messaging is handled through **Socket.IO events**.

---

# Future Improvements

Some possible features that could be added:

- Image storage (Cloudinary / AWS S3)
- Notifications system
- Stories feature
- Infinite scrolling feed
- Message read receipts
- OAuth login (Google / GitHub)

---

# Other Projects

This repository is part of a broader learning journey.  
Other projects built mostly from scratch include:

- **Pokemon Filter:** https://github.com/Piyush-Here/Filter_Pokemon
- **BMI Calculator:** https://github.com/Piyush-Here/BMI_Calculator

These projects involved significantly more manual coding and experimentation.

# Author

Built as a learning project exploring **full-stack web development and system architecture**.