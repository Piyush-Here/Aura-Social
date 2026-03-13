import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { EditProfileModal } from '../Modals/EditProfileModal';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  currentUser: any;
  onUpdateUser: (user: any) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ currentUser, onUpdateUser }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('aura_token');
      const uRes = await fetch(`/api/users/by-username/${username}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const uData = await uRes.json();
      
      if (uRes.ok) {
        setProfile(uData);
        const pRes = await fetch(`/api/users/${uData.id}/posts`);
        const pData = await pRes.json();
        setPosts(pData);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!profile) return <div className={styles.notFound}>User not found</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backBtn}><ChevronLeft size={24} /></button>
        <h2 className={styles.headerUsername}>{profile.username}</h2>
      </div>

      <div className={styles.profileInfo}>
        <img src={profile.avatar_url} alt={profile.username} className={styles.profileAvatar} />
        <div className={styles.profileStats}>
          <div className={styles.usernameRow}>
            <h3 className={styles.username}>{profile.username}</h3>
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditModalOpen(true)} 
                className={styles.editBtn}
              >
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleFollow} 
                className={styles.followBtn}
                style={{
                  background: profile.is_following ? '#eee' : 'var(--accent)',
                  color: profile.is_following ? 'var(--text)' : 'var(--white)'
                }}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <div className={styles.statsRow}>
            <span><strong>{profile.posts_count}</strong> posts</span>
            <span><strong>{profile.followers_count}</strong> followers</span>
            <span><strong>{profile.following_count}</strong> following</span>
          </div>
          <div className={styles.bioSection}>
            <p className={styles.displayName}>{profile.display_name}</p>
            <p className={styles.bio}>{profile.bio}</p>
          </div>
        </div>
      </div>

      <div className={styles.postsGrid}>
        {posts.map(p => (
          <div key={p.id} className={styles.gridItem}>
            <img src={p.image_url} alt="" className={styles.gridImage} />
          </div>
        ))}
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          currentUser={currentUser} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={(updated) => {
            onUpdateUser(updated);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
