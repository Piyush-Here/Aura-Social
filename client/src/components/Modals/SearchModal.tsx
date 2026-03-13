import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Modal.module.css';

interface SearchModalProps {
  onClose: () => void;
  onUserClick: (username: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose, onUserClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.length > 1) {
      fetch(`/api/users/search?q=${query}`)
        .then(res => res.json())
        .then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Search</h3>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className={styles.searchInput}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.resultsList}>
          {results.map(u => (
            <div key={u.id} className={styles.resultItem} onClick={() => { onUserClick(u.username); onClose(); }}>
              <img src={u.avatar_url} alt="" className={styles.resultAvatar} />
              <div>
                <p className={styles.resultUsername}>{u.username}</p>
                <p className={styles.resultDisplayName}>{u.display_name}</p>
              </div>
            </div>
          ))}
          {query.length > 1 && results.length === 0 && (
            <p className={styles.noResults}>No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};
