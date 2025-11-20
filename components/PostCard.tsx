'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types';
import { doc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiTrash2, FiEdit } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onDelete, onShare }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const sharePopupRef = useRef<HTMLDivElement | null>(null);
  const isLiked = user ? post.likes.includes(user.uid) : false;
  const isOwner = user?.uid === post.userId;

  const handleShare = async () => {
    if (!user) return;

    try {
      // Create a share document with the sharer's UID as the ID
      await setDoc(doc(db, `posts/${post.id}/shares`, user.uid), {
        userId: user.uid,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: Timestamp.now(),
      });

      // Increment shareCount on the post
      await updateDoc(doc(db, 'posts', post.id), {
        shareCount: increment(1)
      });

      if (typeof onShare === 'function') onShare(post.id);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://celebra.app';
      const link = `${origin}/post/${post.id}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSharePopup && sharePopupRef.current && !sharePopupRef.current.contains(e.target as Node)) {
        setShowSharePopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSharePopup]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div 
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-1 min-w-0"
          onClick={() => router.push(`/profile/${post.userId}`)}
        >
          {post.photoURL ? (
            <img
              src={post.photoURL}
              alt={post.displayName}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {post.displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{post.displayName}</h3>
            <p className="text-xs text-gray-500 truncate">
              @{post.username} · {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiMoreVertical className="text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-red-600"
                >
                  <FiTrash2 />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3 sm:mb-4">
        <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200">
        <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
        <div className="flex space-x-3 sm:space-x-4">
          <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
          <span>{post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
            isLiked 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiHeart className={isLiked ? 'fill-current' : ''} />
          <span className="font-medium hidden sm:inline">Like</span>
        </button>

        <button
          onClick={() => router.push(`/post/${post.id}`)}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm sm:text-base"
        >
          <FiMessageCircle />
          <span className="font-medium hidden sm:inline">Comment</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSharePopup(prev => !prev)}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm sm:text-base"
          >
            <FiShare2 />
            <span className="font-medium hidden sm:inline">Share</span>
          </button>

          {showSharePopup && (
            <div ref={sharePopupRef} className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-3 border border-gray-200 z-20">
              <div className="px-3">
                <p className="text-sm font-semibold text-gray-900">Share Post</p>
                <p className="text-xs text-gray-500 mb-2">Copy link or share to your feed.</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-800"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={async () => {
                      await handleShare();
                      setShowSharePopup(false);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Share
                  </button>
                </div>
                {copied && (
                  <div className="mt-2 text-xs text-green-600">Copied!</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
