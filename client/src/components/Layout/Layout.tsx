import React from 'react';
import { Navbar } from '../Navbar/Navbar';
import { StatusBanner } from '../Common/StatusBanner';
import { Toast } from '../Common/Toast';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchClick: () => void;
  onDMsClick: () => void;
  onCreateClick: () => void;
  onLogout: () => void;
  toasts: { id: number, message: string }[];
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  activeTab, 
  setActiveTab,
  onSearchClick,
  onDMsClick,
  onCreateClick,
  onLogout,
  toasts
}) => {
  return (
    <div className={styles.appContainer}>
      <StatusBanner />
      <Navbar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onSearchClick={onSearchClick}
        onDMsClick={onDMsClick}
        onCreateClick={onCreateClick}
        onLogout={onLogout}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} />
        ))}
      </div>
    </div>
  );
};
