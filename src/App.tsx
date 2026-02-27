import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  PlusSquare, 
  Home, 
  Search as SearchIcon, 
  User as UserIcon,
  MoreHorizontal,
  Camera,
  X,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { Post, User, Comment, Message } from './types';
import { io, Socket } from 'socket.io-client';

const API_URL = ''; // Same origin

const Navbar = ({ currentUser, onOpenCreate, onOpenSearch, onOpenDMs, onLogout, activeTab }: { 
  currentUser: User | null, 
  onOpenCreate: () => void,
  onOpenSearch: () => void,
  onOpenDMs: () => void,
  onLogout: () => void,
  activeTab: string
}) => (
  <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white border-t md:border-t-0 md:border-b border-black/5 z-50 px-4 py-3">
    <div className="max-w-screen-sm mx-auto flex justify-between items-center">
      <h1 className="hidden md:block font-serif italic text-2xl tracking-tight">Aura</h1>
      <div className="flex justify-around w-full md:w-auto md:gap-8 items-center">
        <button onClick={() => window.location.reload()} className={`p-2 hover:bg-black/5 rounded-full transition-colors ${activeTab === 'home' ? 'text-black' : 'text-black/40'}`}><Home size={24} strokeWidth={1.5} /></button>
        <button onClick={onOpenSearch} className={`p-2 hover:bg-black/5 rounded-full transition-colors ${activeTab === 'search' ? 'text-black' : 'text-black/40'}`}><SearchIcon size={24} strokeWidth={1.5} /></button>
        <button onClick={onOpenCreate} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40"><PlusSquare size={24} strokeWidth={1.5} /></button>
        <button onClick={onOpenDMs} className={`p-2 hover:bg-black/5 rounded-full transition-colors ${activeTab === 'dms' ? 'text-black' : 'text-black/40'}`}><Send size={24} strokeWidth={1.5} /></button>
        <button onClick={onLogout} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40"><LogOut size={24} strokeWidth={1.5} /></button>
        <button className="p-1 border border-black/10 rounded-full">
          <img src={currentUser?.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
        </button>
      </div>
    </div>
  </nav>
);

const PostCard: React.FC<{ post: Post, onLike: (id: string) => void | Promise<void>, currentUser: User | null }> = ({ post, onLike, currentUser }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    if (!currentUser) return;
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike(post.id);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/posts/${post.id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: newComment })
    });
    setNewComment('');
    fetchComments();
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white mb-8 border border-black/5 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.avatar_url} alt={post.username} className="w-8 h-8 rounded-full object-cover border border-black/5" />
          <span className="font-medium text-sm">{post.username}</span>
        </div>
        <button className="text-black/40"><MoreHorizontal size={20} /></button>
      </div>
      
      <div className="aspect-square bg-black/5 relative group">
        <img 
          src={post.image_url} 
          alt={post.caption} 
          className="w-full h-full object-cover"
          onDoubleClick={handleLike}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`transition-colors ${isLiked ? 'text-red-500' : 'text-black'}`}>
              <Heart size={24} strokeWidth={1.5} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-black"><MessageCircle size={24} strokeWidth={1.5} /></button>
            <button className="text-black"><Send size={24} strokeWidth={1.5} /></button>
          </div>
          <button className="text-black"><Bookmark size={24} strokeWidth={1.5} /></button>
        </div>
        
        <div className="space-y-1">
          <p className="font-semibold text-sm">{likes.toLocaleString()} likes</p>
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.username}</span>
            {post.caption}
          </p>
          <button onClick={() => setShowComments(!showComments)} className="text-black/40 text-xs mt-1">
            {showComments ? 'Hide comments' : `View all ${post.comments_count} comments`}
          </button>
          
          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-2 space-y-2"
              >
                {comments.map(c => (
                  <div key={c.id} className="text-sm flex gap-2">
                    <span className="font-semibold">{c.username}</span>
                    <span className="text-black/80">{c.content}</span>
                  </div>
                ))}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    className="flex-1 text-sm bg-black/5 rounded-lg px-3 py-1 focus:outline-none"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="text-blue-500 text-sm font-semibold">Post</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-black/30 uppercase tracking-wider mt-2">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const StatusBanner = ({ status, message }: { status: string, message: string }) => {
  if (status === 'connected') return null;
  return (
    <div className="bg-red-500 text-white text-[10px] py-1 text-center font-medium tracking-wide uppercase">
      {message || 'Database not connected. Please check MONGODB_URI secret.'}
    </div>
  );
};

const AuthForm = ({ onAuth, dbStatus }: { onAuth: (user: User, token: string) => void, dbStatus: { status: string, message: string } }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { username, password } : { username, password, display_name: displayName };
    
    const attemptFetch = async (retries = 2): Promise<any> => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          if (retries > 0) {
            console.log(`Received non-JSON response, retrying in 2s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return attemptFetch(retries - 1);
          }
          const text = await res.text();
          console.error("Non-JSON response received:", text);
          throw new Error(`Server is currently warming up or restarting. Please try again in a few seconds.`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        return data;
      } catch (err: any) {
        if (retries > 0 && (err.message.includes('Failed to fetch') || err.message.includes('warming up'))) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptFetch(retries - 1);
        }
        throw err;
      }
    };

    try {
      const data = await attemptFetch();
      onAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9F9F9] relative">
      <div className="fixed top-0 left-0 right-0 z-[200]">
        <StatusBanner status={dbStatus.status} message={dbStatus.message} />
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-black/5"
      >
        <h1 className="font-serif italic text-4xl text-center mb-8 tracking-tight">Aura</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full px-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Display Name" 
              className="w-full px-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          )}
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-black/60">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-black font-semibold">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const SearchModal = ({ isOpen, onClose, onFollow }: { isOpen: boolean, onClose: () => void, onFollow: (id: string) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/users/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="p-4 border-b border-black/5">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full pl-10 pr-4 py-2 bg-black/5 rounded-xl text-sm focus:outline-none"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {results.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-black/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold">{u.username}</p>
                      <p className="text-xs text-black/40">{u.display_name}</p>
                    </div>
                  </div>
                  <button onClick={() => onFollow(u.id)} className="text-xs font-semibold bg-black text-white px-4 py-1.5 rounded-lg">Follow</button>
                </div>
              ))}
              {query && results.length === 0 && <p className="text-center py-8 text-black/40 text-sm">No users found</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DMsModal = ({ isOpen, onClose, currentUser }: { isOpen: boolean, onClose: () => void, currentUser: User | null }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    socketRef.current = io();
    socketRef.current.emit('join', currentUser.id);
    socketRef.current.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    socketRef.current.on('message_sent', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    // Fetch some contacts (just reuse search for now or a dedicated endpoint)
    fetch('/api/users/search?q=').then(res => res.json()).then(setContacts);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      const token = localStorage.getItem('token');
      fetch(`/api/messages/${selectedUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()).then(setMessages);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;
    socketRef.current?.emit('send_message', {
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage
    });
    setNewMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl h-[600px] rounded-3xl overflow-hidden relative shadow-2xl flex">
            {/* Sidebar */}
            <div className={`w-full md:w-1/3 border-r border-black/5 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-semibold">Messages</h2>
                <button onClick={onClose} className="md:hidden"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {contacts.filter(c => c.id !== currentUser?.id).map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedUser(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${selectedUser?.id === c.id ? 'bg-black/5' : 'hover:bg-black/5'}`}
                  >
                    <img src={c.avatar_url} alt={c.username} className="w-12 h-12 rounded-full object-cover" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{c.username}</p>
                      <p className="text-xs text-black/40">Active now</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-black/5 flex items-center gap-3">
                    <button onClick={() => setSelectedUser(null)} className="md:hidden"><ChevronLeft size={24} /></button>
                    <img src={selectedUser.avatar_url} alt={selectedUser.username} className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-semibold text-sm">{selectedUser.username}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${m.sender_id === currentUser?.id ? 'bg-black text-white' : 'bg-black/5 text-black'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Message..." 
                      className="flex-1 bg-black/5 rounded-full px-4 py-2 text-sm focus:outline-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="text-blue-500 font-semibold text-sm px-2">Send</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-black/40 p-8 text-center">
                  <Send size={48} strokeWidth={1} className="mb-4" />
                  <h3 className="text-lg font-semibold text-black">Your Messages</h3>
                  <p className="text-sm">Send private photos and messages to a friend.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: User | null,
  onPostCreated: () => void
}) => {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!imageUrl || !user) return;
    setIsPosting(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_url: imageUrl, caption })
      });
      onPostCreated();
      onClose();
      setCaption('');
      setImageUrl('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
              <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full"><X size={20} /></button>
              <h2 className="font-semibold">New Post</h2>
              <button onClick={handlePost} disabled={!imageUrl || isPosting} className="text-blue-500 font-semibold disabled:opacity-50">{isPosting ? 'Posting...' : 'Share'}</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="aspect-square bg-black/5 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-black/10 overflow-hidden relative">
                {imageUrl ? <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" /> : (
                  <><Camera size={48} strokeWidth={1} className="text-black/20 mb-2" /><p className="text-sm text-black/40">Enter image URL below</p></>
                )}
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Image URL" className="w-full px-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <textarea placeholder="Write a caption..." className="w-full px-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10 min-h-[100px] resize-none" value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ status: string, message: string }>({ status: 'connecting', message: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDMsModalOpen, setIsDMsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (e) {
      setDbStatus({ status: 'error', message: 'Server unreachable' });
    }
  };

  const fetchData = async () => {
    try {
      checkStatus();
      const postsRes = await fetch('/api/posts');
      const postsData = await postsRes.json();
      if (Array.isArray(postsData)) setPosts(postsData);
      
      const token = localStorage.getItem('token');
      if (token) {
        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAuth = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Followed!');
    } catch (e) {
      console.error(e);
    }
  };

  if (!user && !loading) return <AuthForm onAuth={handleAuth} dbStatus={dbStatus} />;

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-20 bg-[#F9F9F9]">
      <div className="fixed top-0 left-0 right-0 z-[200]">
        <StatusBanner status={dbStatus.status} message={dbStatus.message} />
      </div>
      <Navbar 
        currentUser={user} 
        onOpenCreate={() => setIsCreateModalOpen(true)} 
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenDMs={() => setIsDMsModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
      />
      
      <main className="max-w-screen-sm mx-auto px-4 py-6">
        {/* Stories Placeholder */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 py-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                  <img src={`https://picsum.photos/seed/story${i}/100/100`} alt="Story" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] text-black/60">User_{i}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} currentUser={user} />
            ))}
          </div>
        )}
      </main>

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} user={user} onPostCreated={fetchData} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onFollow={handleFollow} />
      <DMsModal isOpen={isDMsModalOpen} onClose={() => setIsDMsModalOpen(false)} currentUser={user} />
    </div>
  );
}
