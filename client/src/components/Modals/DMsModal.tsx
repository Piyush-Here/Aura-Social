import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import styles from './Modal.module.css';

interface DMsModalProps {
  onClose: () => void;
  currentUser: any;
  socket: any;
  onUserClick: (username: string) => void;
}

export const DMsModal: React.FC<DMsModalProps> = ({ onClose, currentUser, socket, onUserClick }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length > 1) {
      fetch(`/api/users/search?q=${searchQuery}`)
        .then(res => res.json())
        .then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/messages/${selectedUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
      })
        .then(res => res.json())
        .then(setMessages);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (msg: any) => {
        if (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) {
          setMessages(prev => [...prev, msg]);
        }
      };
      socket.on('receive_message', handleMessage);
      socket.on('message_sent', handleMessage);
      return () => {
        socket.off('receive_message', handleMessage);
        socket.off('message_sent', handleMessage);
      };
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;
    socket.emit('send_message', {
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage
    });
    setNewMessage('');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Messages</h3>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          {/* Sidebar */}
          <div style={{width: '200px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column'}}>
            <div style={{padding: '12px'}}>
              <input 
                type="text" 
                placeholder="Search..." 
                className={styles.searchInput}
                style={{fontSize: '12px', padding: '8px'}}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="no-scrollbar" style={{flex: 1, overflowY: 'auto'}}>
              {searchResults.map(u => (
                <div 
                  key={u.id} 
                  className={styles.resultItem} 
                  style={{padding: '8px 12px', background: selectedUser?.id === u.id ? '#f5f5f5' : 'transparent'}}
                  onClick={() => setSelectedUser(u)}
                >
                  <img src={u.avatar_url} alt="" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                  <span style={{fontSize: '13px', fontWeight: 500}}>{u.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            {selectedUser ? (
              <>
                <div 
                  style={{padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer'}}
                  onClick={() => { onUserClick(selectedUser.username); onClose(); }}
                >
                  {selectedUser.username}
                </div>
                <div className="no-scrollbar" style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {messages.map((m, i) => (
                    <div 
                      key={i} 
                      style={{
                        alignSelf: m.sender_id === currentUser.id ? 'flex-end' : 'flex-start',
                        background: m.sender_id === currentUser.id ? 'var(--accent)' : '#efefef',
                        color: m.sender_id === currentUser.id ? 'var(--white)' : 'var(--text)',
                        padding: '8px 12px',
                        borderRadius: '16px',
                        maxWidth: '80%',
                        fontSize: '14px'
                      }}
                    >
                      {m.content}
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
                <form onSubmit={handleSendMessage} style={{padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px'}}>
                  <input 
                    type="text" 
                    placeholder="Message..." 
                    className={styles.searchInput}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className={styles.closeBtn} style={{color: 'var(--accent)'}}><Send size={20} /></button>
                </form>
              </>
            ) : (
              <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                Select a user to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
