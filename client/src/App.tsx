import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home/Home';
import { UserProfile } from './components/Profile/UserProfile';
import { AuthForm } from './components/Auth/AuthForm';
import { SearchModal } from './components/Modals/SearchModal';
import { DMsModal } from './components/Modals/DMsModal';
import { CreatePostModal } from './components/Modals/CreatePostModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    /**
     * Initialize the application:
     * 1. Check for an existing JWT token in localStorage.
     * 2. If found, verify it with the backend to get the user's profile.
     */
    const init = async () => {
      const token = localStorage.getItem('aura_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setCurrentUser(user);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('aura_token');
          }
        } catch (e) {
          console.error("Auth initialization error:", e);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    /**
     * Real-time Connection:
     * When a user logs in, establish a Socket.io connection for real-time features (DMs).
     */
    if (currentUser) {
      socketRef.current = io();
      socketRef.current.emit('join', currentUser.id);
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [currentUser]);

  const handleAuthSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('aura_token', token);
    addToast(`Welcome, ${user.username}!`);
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aura_token');
    addToast('Logged out successfully');
    navigate('/auth');
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  if (loading) return <div className="loading-screen">Loading Aura...</div>;

  if (!currentUser && location.pathname !== '/auth') {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  const activeTab = location.pathname === '/' ? 'feed' : location.pathname.startsWith('/profile') ? 'profile' : '';

  return (
    <Layout 
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={(tab) => tab === 'feed' ? navigate('/') : tab === 'profile' ? navigate(`/profile/${currentUser.username}`) : null}
      onSearchClick={() => setIsSearchOpen(true)}
      onDMsClick={() => setIsDMsOpen(true)}
      onCreateClick={() => setIsCreateOpen(true)}
      onLogout={handleLogout}
      toasts={toasts}
    >
      <Routes>
        <Route path="/" element={
          <Home 
            currentUser={currentUser} 
            onUserClick={handleUserClick} 
            posts={posts} 
            setPosts={setPosts} 
          />
        } />
        <Route path="/profile/:username" element={
          <UserProfile 
            currentUser={currentUser} 
            onUpdateUser={setCurrentUser}
          />
        } />
        <Route path="/auth" element={<AuthForm onSuccess={handleAuthSuccess} />} />
      </Routes>

      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} onUserClick={handleUserClick} />}
      {isDMsOpen && <DMsModal onClose={() => setIsDMsOpen(false)} currentUser={currentUser} socket={socketRef.current} onUserClick={handleUserClick} />}
      {isCreateOpen && (
        <CreatePostModal 
          onClose={() => setIsCreateOpen(false)} 
          onSuccess={() => {
            addToast('Post shared!');
            fetch('/api/posts').then(res => res.json()).then(setPosts);
          }} 
        />
      )}
    </Layout>
  );
}
