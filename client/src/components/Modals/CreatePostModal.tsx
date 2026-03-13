import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import styles from './Modal.module.css';

interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSuccess }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        },
        body: JSON.stringify({ image_url: imageUrl, caption })
      });
      if (res.ok) {
        onSuccess();
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
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create New Post</h3>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{padding: '20px'}}>
          <div style={{marginBottom: '20px'}}>
            <div style={{aspectRatio: '1/1', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px'}}>
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <ImageIcon size={48} color="#ccc" />
              )}
            </div>
            <input 
              type="text" 
              placeholder="Image URL" 
              className={styles.searchInput}
              style={{marginBottom: '12px'}}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
            <textarea 
              placeholder="Write a caption..." 
              className={styles.searchInput}
              style={{height: '100px', resize: 'none', padding: '12px'}}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading || !imageUrl}>
            {loading ? 'Posting...' : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
};
