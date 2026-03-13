import React from 'react';
import { Home, Search, PlusSquare, MessageCircle, User, LogOut } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  onSearchClick: () => void;
  onDMsClick: () => void;
  onCreateClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onSearchClick,
  onDMsClick,
  onCreateClick,
  onLogout
}) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.navLogo} onClick={() => setActiveTab('feed')}>Aura</div>
        <div className={styles.navLinks}>
          <button 
            className={`${styles.navBtn} ${activeTab === 'feed' ? styles.active : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Home size={24} />
          </button>
          <button className={styles.navBtn} onClick={onSearchClick}>
            <Search size={24} />
          </button>
          <button className={styles.navBtn} onClick={onCreateClick}>
            <PlusSquare size={24} />
          </button>
          <button className={styles.navBtn} onClick={onDMsClick}>
            <MessageCircle size={24} />
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className={styles.navAvatar} />
            ) : (
              <User size={24} />
            )}
          </button>
          <button className={styles.navBtn} onClick={onLogout} title="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};
