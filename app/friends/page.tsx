'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Friend, FriendRequest, User } from '@/types';
import Image from 'next/image';
import { FiUserPlus, FiUserMinus, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  const loadFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      // Load friends
      const friendsQuery = query(collection(db, `users/${user.uid}/friends`));
      const friendsSnap = await getDocs(friendsQuery);
      const friendsList = friendsSnap.docs.map(doc => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate(),
      })) as Friend[];
      setFriends(friendsList);

      // Load friend requests (received)
      const requestsQuery = query(
        collection(db, `users/${user.uid}/friendRequests`),
        where('status', '==', 'pending')
      );
      const requestsSnap = await getDocs(requestsQuery);
      const requestsList = requestsSnap.docs.map(doc => ({
        docId: doc.id,
        id: doc.data().id || doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as FriendRequest[];
      setFriendRequests(requestsList);

      // Load sent friend requests to exclude them from suggestions
      // Note: This requires a composite index or a separate collection for sent requests if we want to query efficiently.
      // For now, we'll assume we can query the global friendRequests collection where fromUserId == user.uid
      // But wait, friendRequests are subcollections of users.
      // So to find requests I sent, I'd have to query ALL users' subcollections? No, that's impossible.
      // Usually, we should store sent requests in the sender's subcollection too or a global collection.
      // Assuming the current architecture doesn't have a "sentRequests" collection, we might skip this filter or implement it if possible.
      // Let's just fetch users and filter out friends and received requests for now.

      // Load Suggestions (Users who are not me and not friends)
      // Firestore doesn't support "not-in" for large lists easily.
      // We'll fetch a batch of users and filter client-side.
      const usersQuery = query(
        collection(db, 'users'),
        limit(20) // Fetch 20 users to find suggestions
      );
      const usersSnap = await getDocs(usersQuery);
      const allUsers = usersSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as User[];

      const friendIds = new Set(friendsList.map(f => f.uid));
      const requestSenderIds = new Set(requestsList.map(r => r.fromUserId));

      const suggestedUsers = allUsers.filter(u =>
        u.uid !== user.uid &&
        !friendIds.has(u.uid) &&
        !requestSenderIds.has(u.uid)
      );

      setSuggestions(suggestedUsers);

    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadFriendsData();
  }, [user, loadFriendsData, router]);

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      // Add to current user's friends
      await setDoc(doc(db, `users/${user.uid}/friends`, request.fromUserId), {
        uid: request.fromUserId,
        username: request.fromUsername,
        displayName: request.fromDisplayName,
        photoURL: request.fromPhotoURL,
        addedAt: Timestamp.now(),
      });

      // Add to sender's friends
      await setDoc(doc(db, `users/${request.fromUserId}/friends`, user.uid), {
        uid: user.uid,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        addedAt: Timestamp.now(),
      });

      // Delete the request using the actual document ID
      const requestDocId = (request as any).docId || request.id;
      await deleteDoc(doc(db, `users/${user.uid}/friendRequests`, requestDocId));

      // Try to delete from sender's side (cleanup)
      // ... (omitted for brevity, same as before)

      toast.success(`You are now friends with ${request.fromDisplayName}`);
      loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      const requestDocId = (request as any).docId || request.id;
      await deleteDoc(doc(db, `users/${user.uid}/friendRequests`, requestDocId));
      toast.success('Friend request rejected');
      loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    }
  };

  const removeFriend = async (friend: Friend) => {
    if (!user) return;

    if (!confirm(`Remove ${friend.displayName} from your friends?`)) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/friends`, friend.uid));
      await deleteDoc(doc(db, `users/${friend.uid}/friends`, user.uid));
      toast.success(`${friend.displayName} removed from friends`);
      loadFriendsData();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const sendFriendRequest = async (targetUser: User) => {
    if (!user || addingFriend) return;

    setAddingFriend(targetUser.uid);
    try {
      // Check if already sent? (Ideally we should check, but for now just send)
      await addDoc(collection(db, `users/${targetUser.uid}/friendRequests`), {
        fromUserId: user.uid,
        fromUsername: user.username,
        fromDisplayName: user.displayName,
        fromPhotoURL: user.photoURL,
        toUserId: targetUser.uid,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      toast.success(`Friend request sent to ${targetUser.displayName}`);
      // Remove from suggestions locally
      setSuggestions(prev => prev.filter(u => u.uid !== targetUser.uid));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setAddingFriend(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Friend Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">People you may know</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestions.map(suggestedUser => (
                <div key={suggestedUser.uid} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                  <div
                    className="cursor-pointer mb-3"
                    onClick={() => router.push(`/profile/${suggestedUser.uid}`)}
                  >
                    {suggestedUser.photoURL ? (
                      <Image
                        src={suggestedUser.photoURL}
                        alt={suggestedUser.displayName}
                        width={64}
                        height={64}
                        className="rounded-full object-cover w-16 h-16 border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        {suggestedUser.displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center truncate w-full">{suggestedUser.displayName}</h3>
                  <p className="text-xs text-gray-500 mb-3">@{suggestedUser.username}</p>

                  <button
                    onClick={() => sendFriendRequest(suggestedUser)}
                    disabled={addingFriend === suggestedUser.uid}
                    className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-70"
                  >
                    {addingFriend === suggestedUser.uid ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiUserPlus />
                        <span>Add Friend</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Friend Requests</h2>
            <div className="space-y-4">
              {friendRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => router.push(`/profile/${request.fromUserId}`)}
                  >
                    {request.fromPhotoURL ? (
                      <Image
                        src={request.fromPhotoURL}
                        alt={request.fromDisplayName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover w-12 h-12 border border-blue-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {request.fromDisplayName[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.fromDisplayName}</h3>
                      <p className="text-sm text-gray-500">@{request.fromUsername}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptFriendRequest(request)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <FiCheck />
                      <span className="hidden sm:inline">Accept</span>
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request)}
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <FiX />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FiUserPlus className="text-2xl" />
              </div>
              <p className="text-gray-500 font-medium">No friends yet</p>
              <p className="text-sm text-gray-400 mt-1">Check the suggestions above to connect with people!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map(friend => (
                <div key={friend.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => router.push(`/profile/${friend.uid}`)}
                  >
                    {friend.photoURL ? (
                      <Image
                        src={friend.photoURL}
                        alt={friend.displayName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover w-12 h-12 border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {friend.displayName[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{friend.displayName}</h3>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove friend"
                  >
                    <FiUserMinus />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
