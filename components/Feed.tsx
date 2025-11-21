'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  startAfter,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types';
import PostCard from './PostCard';
import CreatePost from './CreatePost';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const POSTS_PER_PAGE = 10;

  const loadPosts = useCallback(async (isInitial = true) => {
    if (!isInitial && !hasMore) return;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let q;
      if (isInitial || !lastDoc) {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Post[];

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasMore, lastDoc]);

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loadPosts]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    const postRef = doc(db, 'posts', postId);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
          likeCount: increment(-1)
        });
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: p.likes.filter(id => id !== user.uid),
                likeCount: p.likeCount - 1
              } 
            : p
        ));
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          likeCount: increment(1)
        });
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: [...p.likes, user.uid],
                likeCount: p.likeCount + 1
              } 
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleShare = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <CreatePost onPostCreated={handlePostCreated} />

        <div className="mt-6 flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <CreatePost onPostCreated={handlePostCreated} />

      <div className="space-y-4 mt-6">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-blue-600"></div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          You&apos;ve reached the end
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
