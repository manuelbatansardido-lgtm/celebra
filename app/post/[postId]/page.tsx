"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post, Comment } from '@/types';
import Image from 'next/image';
import { FiHeart, FiMessageCircle, FiShare2, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function PostPage({ params }: { params: { postId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const { postId } = params;


  const loadPost = useCallback(async () => {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = {
          id: postDoc.id,
          ...postDoc.data(),
          createdAt: postDoc.data().createdAt?.toDate(),
          updatedAt: postDoc.data().updatedAt?.toDate(),
        } as Post;
        setPost(postData);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    setCommentError(null);
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const commentsSnap = await getDocs(commentsQuery);
      const commentsList = commentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Comment[];
      setComments(commentsList);
    } catch (error) {
      console.error('Error loading comments:', error);
      if (error instanceof FirebaseError && error.code === 'failed-precondition') {
        setCommentError('Comments require a Firestore composite index. Deploy firestore.indexes.json to your Firebase project.');
      } else {
        setCommentError('Unable to load comments right now. Please try again later.');
      }
    }
  }, [postId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    loadPost();
    loadComments();
  }, [postId, user, authLoading, router, loadPost, loadComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !post) return;

    try {
      setSubmitting(true);
      setCommentError(null);

      const commentData = {
        postId: post.id,
        userId: user.uid,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        content: newComment.trim(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'comments'), commentData);

      // Update comment count
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });

      setNewComment('');
      loadComments();
      loadPost();
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        setCommentError('Comments are currently locked by Firestore rules. Deploy the latest firestore.rules to enable commenting.');
      } else {
        setCommentError('Unable to post your comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    const isLiked = post.likes.includes(user.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: post.likes.filter(id => id !== user.uid),
          likeCount: increment(-1)
        });
        setPost({
          ...post,
          likes: post.likes.filter(id => id !== user.uid),
          likeCount: post.likeCount - 1
        });
      } else {
        await updateDoc(postRef, {
          likes: [...post.likes, user.uid],
          likeCount: increment(1)
        });
        setPost({
          ...post,
          likes: [...post.likes, user.uid],
          likeCount: post.likeCount + 1
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Post not found</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isLiked = user ? post.likes.includes(user.uid) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Post */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          {/* Header */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 mb-3 cursor-pointer"
            onClick={() => router.push(`/profile/${post.userId}`)}
          >
            {post.photoURL ? (
              <Image
                src={post.photoURL}
                alt={post.displayName}
                width={48}
                height={48}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
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

          {/* Content */}
          <div className="mb-4">
            <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
            <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
            <div className="flex space-x-3 sm:space-x-4">
              <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
              <span>{post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${isLiked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} />
              <span className="font-medium hidden sm:inline">Like</span>
            </button>

            <button className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600 bg-blue-50 text-sm sm:text-base">
              <FiMessageCircle />
              <span className="font-medium hidden sm:inline">Comment</span>
            </button>

            <button className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm sm:text-base">
              <FiShare2 />
              <span className="font-medium hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Comment Input */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          <form onSubmit={handleSubmitComment}>
            <div className="flex items-start space-x-2 sm:space-x-3">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                  disabled={submitting}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <span>{submitting ? 'Posting...' : 'Comment'}</span>
                    <FiSend className="text-sm sm:text-base" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          {commentError && (
            <p className="mt-2 text-sm text-red-600">{commentError}</p>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold px-2 sm:px-0">
            Comments ({comments.length})
          </h2>
          {commentError ? (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center text-red-600 text-sm sm:text-base">
              {commentError}
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div
                  className="flex items-start space-x-2 sm:space-x-3 cursor-pointer"
                  onClick={() => router.push(`/profile/${comment.userId}`)}
                >
                  {comment.photoURL ? (
                    <Image
                      src={comment.photoURL}
                      alt={comment.displayName}
                      width={40}
                      height={40}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {comment.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{comment.displayName}</h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">@{comment.username}</p>
                    <p className="mt-2 text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
