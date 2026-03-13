import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface EditProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentUser, onClose, onSuccess }) => {
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: bio
        })
      });

      if (res.ok) {
        onSuccess({ ...currentUser, display_name: displayName, avatar_url: avatarUrl, bio: bio });
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className={styles.modalHeader}>
          <h3>Edit Profile</h3>
          <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label>Display Name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Profile Picture URL</label>
            <input 
              type="text" 
              value={avatarUrl} 
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            {avatarUrl && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img 
                  src={avatarUrl} 
                  alt="Preview" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} 
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/80?text=Error')}
                />
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
