'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types';
import { FiImage, FiSend } from 'react-icons/fi';

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !user) return;

    try {
      setLoading(true);

      const postData = {
        userId: user.uid,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        content: content.trim(),
        likes: [],
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      const newPost: Post = {
        id: docRef.id,
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onPostCreated(newPost);
      setContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user?.displayName}?`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
              disabled={loading}
            />

            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>{loading ? 'Posting...' : 'Post'}</span>
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
