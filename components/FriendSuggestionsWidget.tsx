'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    collection,
    query,
    getDocs,
    addDoc,
    limit,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Friend } from '@/types';
import Image from 'next/image';
import { FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FriendSuggestionsWidgetProps {
    maxSuggestions?: number;
}

export default function FriendSuggestionsWidget({ maxSuggestions = 3 }: FriendSuggestionsWidgetProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingFriend, setAddingFriend] = useState<string | null>(null);

    useEffect(() => {
        const loadSuggestions = async () => {
            if (!user) return;

            try {
                // 1. Get my friends
                const friendsSnap = await getDocs(collection(db, `users/${user.uid}/friends`));
                const friendIds = new Set(friendsSnap.docs.map(d => d.id));

                // 2. Get pending requests (sent by me or received by me)
                // Ideally we'd have a better structure, but let's check received first
                const receivedRequestsSnap = await getDocs(query(
                    collection(db, `users/${user.uid}/friendRequests`),
                    where('status', '==', 'pending')
                ));
                const requestSenderIds = new Set(receivedRequestsSnap.docs.map(d => d.data().fromUserId));

                // 3. Fetch users
                // We fetch more than maxSuggestions because we might filter some out
                const usersQuery = query(collection(db, 'users'), limit(20));
                const usersSnap = await getDocs(usersQuery);

                const allUsers = usersSnap.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data(),
                })) as User[];

                // 4. Filter
                const filtered = allUsers.filter(u =>
                    u.uid !== user.uid &&
                    !friendIds.has(u.uid) &&
                    !requestSenderIds.has(u.uid)
                );

                setSuggestions(filtered.slice(0, maxSuggestions));
            } catch (error) {
                console.error('Error loading suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSuggestions();
    }, [user, maxSuggestions]);

    const sendFriendRequest = async (targetUser: User) => {
        if (!user || addingFriend) return;

        setAddingFriend(targetUser.uid);
        try {
            await addDoc(collection(db, `users/${targetUser.uid}/friendRequests`), {
                fromUserId: user.uid,
                fromUsername: user.username,
                fromDisplayName: user.displayName,
                fromPhotoURL: user.photoURL,
                toUserId: targetUser.uid,
                status: 'pending',
                createdAt: Timestamp.now(),
            });

            toast.success(`Request sent to ${targetUser.displayName}`);
            setSuggestions(prev => prev.filter(u => u.uid !== targetUser.uid));
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send request');
        } finally {
            setAddingFriend(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(maxSuggestions)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2 mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">People you may know</h3>
            <div className="space-y-4">
                {suggestions.map(suggestedUser => (
                    <div key={suggestedUser.uid} className="flex items-center justify-between">
                        <div
                            className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                            onClick={() => router.push(`/profile/${suggestedUser.uid}`)}
                        >
                            {suggestedUser.photoURL ? (
                                <Image
                                    src={suggestedUser.photoURL}
                                    alt={suggestedUser.displayName}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover w-10 h-10 border border-gray-100"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {suggestedUser.displayName[0].toUpperCase()}
                                </div>
                            )}
                            <div className="truncate">
                                <p className="font-semibold text-sm text-gray-900 truncate">{suggestedUser.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">@{suggestedUser.username}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => sendFriendRequest(suggestedUser)}
                            disabled={addingFriend === suggestedUser.uid}
                            className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Add Friend"
                        >
                            {addingFriend === suggestedUser.uid ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <FiUserPlus />
                            )}
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => router.push('/friends')}
                className="w-full mt-4 text-xs text-blue-600 font-medium hover:underline text-center block"
            >
                See all suggestions
            </button>
        </div>
    );
}
