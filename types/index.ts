export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  displayNameLower?: string;
  photoURL: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  likes: string[]; // Array of user IDs who liked
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  docId?: string; // Actual Firestore document ID
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromPhotoURL: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Friend {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  addedAt: Date;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      username: string;
      displayName: string;
      photoURL: string;
    };
  };
  lastMessage: string;
  lastMessageTime: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderPhotoURL: string;
  content: string;
  createdAt: Date;
  read: boolean;
  // Optional status for optimistic UI: 'sending' while pending, 'sent' when persisted, 'failed' on error
  status?: 'sending' | 'sent' | 'failed';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
  modelUsed?: string;
}
