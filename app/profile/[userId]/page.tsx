'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Post, Friend } from '@/types';
import PostCard from '@/components/PostCard';
import Image from 'next/image';
import { FiUserPlus, FiUserCheck, FiMessageCircle, FiEdit } from 'react-icons/fi';

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user: currentUser, updateUserProfile } = useAuth();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '' });

  const isOwnProfile = currentUser?.uid === params.userId;

  const loadProfileData = useCallback(async () => {
    try {
      // Load user profile
      const userDoc = await getDoc(doc(db, 'users', params.userId));
      if (userDoc.exists()) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setProfileUser(userData);
        setEditData({
          displayName: userData.displayName,
          bio: userData.bio || '',
        });
      }

      // Load user posts
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', params.userId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const postsSnap = await getDocs(postsQuery);
        const postsList = postsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Post[];
        setPosts(postsList);
      } catch (postsError) {
        console.error('Error loading posts:', postsError);
        // If composite index not deployed, try without orderBy
        try {
          const postsQuerySimple = query(
            collection(db, 'posts'),
            where('userId', '==', params.userId),
            limit(20)
          );
          const postsSnap = await getDocs(postsQuerySimple);
          const postsList = postsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as Post[];
          // Sort on client side
          postsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setPosts(postsList);
        } catch (fallbackError) {
          console.error('Error loading posts (fallback):', fallbackError);
          setPosts([]);
        }
      }

      // Load friends
      const friendsQuery = query(collection(db, `users/${params.userId}/friends`));
      const friendsSnap = await getDocs(friendsQuery);
      const friendsList = friendsSnap.docs.map(doc => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate(),
      })) as Friend[];
      setFriends(friendsList);

      // Check friendship status
      if (currentUser && !isOwnProfile) {
        const friendDoc = await getDoc(doc(db, `users/${currentUser.uid}/friends`, params.userId));
        setIsFriend(friendDoc.exists());

        // Check if request already sent
        const requestDoc = await getDoc(doc(db, `users/${params.userId}/friendRequests`, currentUser.uid));
        setRequestSent(requestDoc.exists());
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [params.userId, currentUser, isOwnProfile]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Realtime listeners for friend status and request status so UI updates immediately
  useEffect(() => {
    if (!currentUser || isOwnProfile) return;

    const friendRef = doc(db, `users/${currentUser.uid}/friends`, params.userId);
    const requestRef = doc(db, `users/${params.userId}/friendRequests`, currentUser.uid);

    const unsubFriend = onSnapshot(friendRef, (snap) => {
      setIsFriend(snap.exists());
    }, (err) => console.error('Friend onSnapshot error:', err));

    const unsubRequest = onSnapshot(requestRef, (snap) => {
      setRequestSent(snap.exists());
    }, (err) => console.error('Request onSnapshot error:', err));

    return () => {
      try { unsubFriend(); } catch (e) {}
      try { unsubRequest(); } catch (e) {}
    };
  }, [currentUser, params.userId, isOwnProfile]);


  const sendFriendRequest = async () => {
    if (!currentUser || !profileUser) return;

    try {
      const requestData = {
        senderId: currentUser.uid,
        fromUserId: currentUser.uid,
        fromUsername: currentUser.username,
        fromDisplayName: currentUser.displayName,
        fromPhotoURL: currentUser.photoURL,
        toUserId: profileUser.uid,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      // Use setDoc with the sender's UID as the document ID so we can
      // easily check for an existing request and delete it later.
      await setDoc(doc(db, `users/${profileUser.uid}/friendRequests`, currentUser.uid), {
        ...requestData,
        id: currentUser.uid,
      });

      setRequestSent(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const startChat = async () => {
    if (!currentUser || !profileUser) return;

    try {
      // Check if chat already exists
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const chatsSnap = await getDocs(chatsQuery);

      const existingChat = chatsSnap.docs.find(doc =>
        doc.data().participants.includes(profileUser.uid)
      );

      if (existingChat) {
        router.push('/messages');
        return;
      }

      // Create new chat
      await addDoc(collection(db, 'chats'), {
        participants: [currentUser.uid, profileUser.uid],
        participantDetails: {
          [currentUser.uid]: {
            username: currentUser.username,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
          [profileUser.uid]: {
            username: profileUser.username,
            displayName: profileUser.displayName,
            photoURL: profileUser.photoURL,
          },
        },
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      router.push('/messages');
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile || !currentUser) return;

    try {
      await updateUserProfile({
        displayName: editData.displayName,
        bio: editData.bio,
      });
      setIsEditing(false);
      loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;

    try {
      // Note: File upload requires Firebase Storage setup
      // For now, you can use a URL from the file input
      console.log('Photo upload feature - requires Firebase Storage configuration');
      alert('Photo upload feature coming soon!');
    } catch (error) {
      console.error('Error uploading photo:', error);
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

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0 w-full sm:w-auto">
              <div className="relative flex-shrink-0">
                {profileUser.photoURL ? (
                  <Image
                    src={profileUser.photoURL}
                    alt={profileUser.displayName}
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
                    {profileUser.displayName[0].toUpperCase()}
                  </div>
                )}
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                    <FiEdit className="text-xs sm:text-sm" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="text-xl sm:text-2xl font-bold mb-1 border border-gray-300 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{profileUser.displayName}</h1>
                )}
                <p className="text-gray-600 text-sm sm:text-base truncate">@{profileUser.username}</p>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={startChat}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <FiMessageCircle />
                  <span>Message</span>
                </button>
                {isFriend ? (
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
                    <FiUserCheck />
                    <span>Friends</span>
                  </button>
                ) : requestSent ? (
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed text-sm sm:text-base">
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={sendFriendRequest}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <FiUserPlus />
                    <span>Add Friend</span>
                  </button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="w-full sm:w-auto">
                {isEditing ? (
                  <button
                    onClick={handleSaveProfile}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Save Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <FiEdit />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Write something about yourself..."
                className="w-full border border-gray-300 rounded px-3 py-2 resize-none text-sm sm:text-base"
                rows={3}
              />
            ) : (
              <p className="text-gray-700 text-sm sm:text-base">{profileUser.bio || 'No bio yet'}</p>
            )}
          </div>

          <div className="flex space-x-4 sm:space-x-6 mt-4 text-sm">
            <div>
              <span className="font-bold text-gray-900">{posts.length}</span>
              <span className="text-gray-600 ml-1">Posts</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{friends.length}</span>
              <span className="text-gray-600 ml-1">Friends</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold px-2 sm:px-0">Posts</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center text-gray-500">
              No posts yet
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={async () => { }}
                onDelete={async () => {
                  setPosts(posts.filter(p => p.id !== post.id));
                }}
                onShare={(postId: string) => {
                  setPosts(prev => prev.map(p => p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p));
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
