export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string;
  likes_count: number;
  comments_count: number;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}
