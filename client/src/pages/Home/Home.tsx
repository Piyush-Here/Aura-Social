import React, { useState, useEffect } from 'react';
import { PostCard } from '../../components/PostCard/PostCard';
import styles from './Home.module.css';

interface HomeProps {
  currentUser: any;
  onUserClick: (userId: string) => void;
  posts: any[];
  setPosts: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Home: React.FC<HomeProps> = ({ currentUser, onUserClick, posts, setPosts }) => {
  const [loading, setLoading] = useState(posts.length === 0);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, [setPosts]);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
      });
      if (res.ok) {
        // Refetch posts to get updated like counts
        const updatedRes = await fetch('/api/posts');
        const updatedData = await updatedRes.json();
        setPosts(updatedData);
      }
    } catch (e) {
      console.error("Like error:", e);
    }
  };

  if (loading) return <div className={styles.loading}>Loading feed...</div>;

  return (
    <div className={styles.homeContainer}>
      <div className={styles.feed}>
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser} 
            onUserClick={onUserClick}
            onLike={handleLike}
          />
        ))}
      </div>
    </div>
  );
};
