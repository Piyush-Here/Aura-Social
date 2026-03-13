import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: any;
  currentUser: any;
  onUserClick: (username: string) => void;
  onLike: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onUserClick, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (showComments) {
      fetch(`/api/posts/${post.id}/comments`)
        .then(res => res.json())
        .then(setComments);
    }
  }, [showComments, post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` },
      body: JSON.stringify({ content: newComment })
    });
    if (res.ok) {
      setNewComment('');
      const updated = await fetch(`/api/posts/${post.id}/comments`).then(r => r.json());
      setComments(updated);
    }
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.postUser} onClick={() => onUserClick(post.username)}>
          <img src={post.avatar_url} alt="" className={styles.postAvatar} />
          <span className={styles.postUsername}>{post.username}</span>
        </div>
        <MoreHorizontal size={20} color="var(--text-muted)" />
      </div>

      <div className={styles.postImageContainer}>
        <img src={post.image_url} alt="" className={styles.postImage} />
      </div>

      <div className={styles.postActions}>
        <div className={styles.actionBtns}>
          <button 
            className={styles.actionBtn} 
            onClick={() => onLike(post.id)}
          >
            <Heart size={24} color="currentColor" />
          </button>
          <button className={styles.actionBtn} onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={24} />
          </button>
          <button className={styles.actionBtn}>
            <Send size={24} />
          </button>
          <div style={{flex: 1}} />
          <button className={styles.actionBtn}>
            <Bookmark size={24} />
          </button>
        </div>

        <div className={styles.postContent}>
          <p className={styles.postLikes}>{post.likes_count} likes</p>
          <p className={styles.postCaption}>
            <span className={styles.postUsername} onClick={() => onUserClick(post.username)}>{post.username}</span> {post.caption}
          </p>
          
          <button 
            className={styles.viewCommentsBtn}
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? 'Hide comments' : `View all ${post.comments_count} comments`}
          </button>

          {showComments && (
            <div className={styles.commentsSection}>
              <div className={styles.commentsList}>
                {comments.map(c => (
                  <div key={c.id} className={styles.commentItem}>
                    <span className={styles.postUsername} onClick={() => onUserClick(c.username)}>{c.username}</span>
                    <span className={styles.commentText}>{c.content}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className={styles.commentForm}>
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  className={styles.commentInput}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className={styles.commentSubmit}>Post</button>
              </form>
            </div>
          )}

          <p className={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
