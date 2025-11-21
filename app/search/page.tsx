'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import Image from 'next/image';
import { FiUser, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';

function SearchContent() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, { isFriend?: boolean; requestSent?: boolean }>>({});

  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Search by username (case-insensitive)
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        limit(20)
      );

      const usernameSnap = await getDocs(usernameQuery);
      const usernameResults = usernameSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];

      // Search by display name
      const displayNameQuery = query(
        collection(db, 'users'),
        where('displayNameLower', '>=', searchQuery.toLowerCase()),
        where('displayNameLower', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        limit(20)
      );

      const displayNameSnap = await getDocs(displayNameQuery);
      const displayNameResults = displayNameSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];

      // Combine and deduplicate results
      const combined = [...usernameResults, ...displayNameResults];
      const uniqueUsers = Array.from(
        new Map(combined.map(user => [user.uid, user])).values()
      );

      setUsers(uniqueUsers);

      // Reset statuses for new results
      setStatuses({});
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (searchQuery) {
      searchUsers();
    } else {
      setLoading(false);
    }
  }, [searchQuery, currentUser, router, searchUsers]);

  const sendFriendRequest = async (targetUid: string) => {
    if (!currentUser) return;

    try {
      const requestData = {
        senderId: currentUser.uid,
        fromUserId: currentUser.uid,
        fromUsername: currentUser.username,
        fromDisplayName: currentUser.displayName,
        fromPhotoURL: currentUser.photoURL,
        toUserId: targetUid,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, `users/${targetUid}/friendRequests`, currentUser.uid), {
        ...requestData,
        id: currentUser.uid,
      });

      setStatuses(prev => ({ ...prev, [targetUid]: { ...(prev[targetUid] || {}), requestSent: true } }));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Setup realtime listeners for statuses for the displayed users
  useEffect(() => {
    if (!currentUser || users.length === 0) return;

    const unsubs: Array<() => void> = [];

    users.forEach(u => {
      if (u.uid === currentUser.uid) return;

      const friendRef = doc(db, `users/${currentUser.uid}/friends`, u.uid);
      const reqRef = doc(db, `users/${u.uid}/friendRequests`, currentUser.uid);

      const unsubF = onSnapshot(friendRef, snap => {
        setStatuses(prev => ({ ...prev, [u.uid]: { ...(prev[u.uid] || {}), isFriend: snap.exists() } }));
      }, err => console.error('friend onSnapshot error:', err));

      const unsubR = onSnapshot(reqRef, snap => {
        setStatuses(prev => ({ ...prev, [u.uid]: { ...(prev[u.uid] || {}), requestSent: snap.exists() } }));
      }, err => console.error('request onSnapshot error:', err));

      unsubs.push(unsubF, unsubR);
    });

    return () => {
      unsubs.forEach(u => {
        try { u(); } catch (e) {}
      });
    };
  }, [users, currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">
            {searchQuery ? (
              <>Search results for &ldquo;{searchQuery}&rdquo;</>
            ) : (
              'Search'
            )}
          </h1>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? (
                <p>No users found matching &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <p>Enter a search query to find users</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.uid}
                  onClick={() => router.push(`/profile/${user.uid}`)}
                  className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                      {user.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{user.displayName}</h3>
                    <p className="text-gray-600 truncate">@{user.username}</p>
                    {user.bio && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-1">{user.bio}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {user.uid === currentUser.uid ? (
                      <span className="text-sm text-gray-500">You</span>
                    ) : (
                      (() => {
                        const st = statuses[user.uid] || { isFriend: false, requestSent: false };
                        if (st.isFriend) {
                          return (
                            <div className="flex items-center space-x-2 text-gray-700">
                              <FiUserCheck className="text-green-600" />
                              <span className="text-sm">Friends</span>
                            </div>
                          );
                        }
                        if (st.requestSent) {
                          return <span className="text-sm text-gray-500">Request Sent</span>;
                        }
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendFriendRequest(user.uid);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                          >
                            <FiUserPlus />
                            <span className="ml-2">Add Friend</span>
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
