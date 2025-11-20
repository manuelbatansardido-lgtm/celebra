'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { usePathname, useRouter } from 'next/navigation';

interface NotificationContextType {
    unreadMessagesCount: number;
    friendRequestsCount: number;
    isSending: boolean;
    setSending: (sending: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadMessagesCount: 0,
    friendRequestsCount: 0,
    isSending: false,
    setSending: () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [friendRequestsCount, setFriendRequestsCount] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Refs to track previous state for diffing
    const prevUnreadCountRef = useRef(0);
    const isFirstLoadRef = useRef(true);

    const setSending = (sending: boolean) => {
        setIsSending(sending);
    };

    useEffect(() => {
        if (!user) {
            setUnreadMessagesCount(0);
            setFriendRequestsCount(0);
            return;
        }

        // 1. Friend Requests Listener
        const frRef = collection(db, `users/${user.uid}/friendRequests`);
        const frUnsub = onSnapshot(frRef, (snap) => {
            setFriendRequestsCount(snap.size);
        });

        // 2. Chats Listener for Unread Messages
        const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const chatsUnsub = onSnapshot(chatsQuery, (snap) => {
            let total = 0;
            let newUnreadFound = false;
            let lastSenderName = '';

            snap.docs.forEach(d => {
                const data = d.data();
                const uc = data.unreadCounts || {};
                const count = uc[user.uid] || 0;
                total += count;
            });

            setUnreadMessagesCount(total);

            if (!isFirstLoadRef.current && total > prevUnreadCountRef.current) {
                if (!pathname?.startsWith('/messages')) {
                    toast('New message received!', {
                        icon: '💬',
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }
            }

            prevUnreadCountRef.current = total;
            isFirstLoadRef.current = false;
        });

        return () => {
            frUnsub();
            chatsUnsub();
        };
    }, [user, pathname]);

    return (
        <NotificationContext.Provider value={{ unreadMessagesCount, friendRequestsCount, isSending, setSending }}>
            {children}
        </NotificationContext.Provider>
    );
};
