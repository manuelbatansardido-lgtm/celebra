'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  limitToLast,
  startAfter,
  Timestamp,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  runTransaction,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message } from '@/types';
import { FiSend, FiCheck, FiRefreshCcw, FiSearch, FiMoreVertical, FiArrowLeft } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiCopy } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
  modelUsed?: string;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAISelected, setIsAISelected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConversationOpen, setIsConversationOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MESSAGES_PER_PAGE = 10;

  // Load Chats
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
        const chatsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastMessageTime: doc.data().lastMessageTime?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Chat[];

        chatsList.sort((a, b) => (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0));
        setChats(chatsList);

        try {
          const counts: Record<string, number> = {};
          chatsList.forEach(c => {
            const map: any = (c as any).unreadCounts || {};
            counts[c.id] = map[user.uid] || 0;
          });
          setUnreadCounts(counts);
        } catch (e) {
          console.error('Error extracting per-chat unread counts', e);
        }

        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, router]);

  // Smart Scroll Logic
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  const suppressAutoScrollRef = useRef(false);
  }, []);

  // Auto-scroll on new messages (ONLY if sent by me)
  // Auto-scroll on new messages but avoid forcing scroll while user is reading older messages
  const prevLastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage.id;

    // If the last message id hasn't changed, don't auto-scroll (likely metadata updates)
    if (prevLastMessageIdRef.current === lastId) return;

    // Determine if user is near bottom already (within 150px)
    const container = scrollContainerRef.current;
    const isNearBottom = container
      ? (container.scrollHeight - container.scrollTop - container.clientHeight) < 150
      : true;

    const isMyMessage = lastMessage.senderId === user?.uid;

    // Auto-scroll when it's my message (I sent it) or when the user was already near bottom.
    if (isMyMessage || isNearBottom) {
      scrollToBottom(true);
    }

    prevLastMessageIdRef.current = lastId;
  }, [messages, user, scrollToBottom]);

  // Load Messages for Selected Chat
  useEffect(() => {
    let msgsUnsub: (() => void) | undefined;

    const setupMessagesListener = async () => {
      if (!selectedChat) return;

      setLoading(true);
      setMessages([]);
      setHasMore(true);
      setLastDoc(null);

      try {
        const messagesCollection = collection(db, `chats/${selectedChat.id}/messages`);
        // Initial load: listen to the latest N messages (descending), then reverse for ascending display.
        const q = query(messagesCollection, orderBy('createdAt', 'desc'), limit(MESSAGES_PER_PAGE));

        msgsUnsub = onSnapshot(q, { includeMetadataChanges: true }, async (snapshot) => {
          const newMessagesDesc = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            // Check pending writes for status
            status: doc.metadata.hasPendingWrites ? 'sending' : (doc.data().status || 'sent')
          })) as Message[];

          // Reverse to ascending order for the UI
          const newMessages = newMessagesDesc.reverse();

          setMessages(newMessages);

          // If this is the first load, scroll to bottom
          if (snapshot.docChanges().some(change => change.type === 'added')) {
            // Logic handled by the other useEffect, but for initial load we might need to force it
          }

          // Mark as read
          const unreadMsgs = snapshot.docs.filter(d => !d.data().read && d.data().senderId !== user?.uid);
          if (unreadMsgs.length > 0) {
            const batchPromises = unreadMsgs.map(d =>
              updateDoc(doc(db, `chats/${selectedChat.id}/messages`, d.id), { read: true })
            );
            await Promise.all(batchPromises);
            // Optimistically update unread count locally so UI updates immediately
            setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));

            // Also update the chat document's unreadCounts map in Firestore so global listeners (Navbar/NotificationContext)
            // receive the update and clear the badge when the user has seen messages.
            try {
              const uid = user?.uid;
              if (uid) {
                const chatRef = doc(db, 'chats', selectedChat.id);
                // Use a transaction to avoid races with concurrent increments from senders
                await runTransaction(db, async (tx) => {
                  const chatSnap = await tx.get(chatRef);
                  if (!chatSnap.exists()) return;
                  const data: any = chatSnap.data();
                  const uc = data.unreadCounts || {};
                  // Only update if there's a non-zero count for this user
                  if (uc[uid] && uc[uid] > 0) {
                    tx.update(chatRef, { [`unreadCounts.${uid}`]: 0 });
                  }
                });
              }
            } catch (e) {
              console.error('Failed to clear chat unreadCounts for chat', selectedChat.id, e);
            }
          }

          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up listener", error);
        setLoading(false);
      }
    };

    if (selectedChat) {
      setupMessagesListener();
      // Ensure the chat's per-user unread count is cleared when opening the conversation.
      (async () => {
        try {
          const uid = user?.uid;
          if (uid) {
            const chatRef = doc(db, 'chats', selectedChat.id);
            await runTransaction(db, async (tx) => {
              const chatSnap = await tx.get(chatRef);
              if (!chatSnap.exists()) return;
              const data: any = chatSnap.data();
              const uc = data.unreadCounts || {};
              if (uc[uid] && uc[uid] > 0) {
                tx.update(chatRef, { [`unreadCounts.${uid}`]: 0 });
              }
            });
          }
        } catch (e) {
          console.error('Failed to clear unreadCounts on open for chat', selectedChat.id, e);
        }

        // Also update local UI state immediately
        setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));
      })();
      setIsConversationOpen(true);
    } else {
      setIsConversationOpen(false);
    }

    return () => {
      if (msgsUnsub) msgsUnsub();
    };
  }, [selectedChat, user]);

  const loadMoreMessages = async () => {
    if (!selectedChat || loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const firstMsg = messages[0];

    // Capture current scroll height to maintain position
    const currentScrollHeight = scrollContainerRef.current?.scrollHeight || 0;

    try {
      // We need to find the doc for the first message to paginate before it
      // Since we don't have the doc object stored in state easily, we might need to fetch it or query by date
      // Simpler: Query messages older than the first message's createdAt
      const messagesCollection = collection(db, `chats/${selectedChat.id}/messages`);
      // We query in descending order starting after the oldest message's timestamp to fetch older items,
      // then reverse the results before prepending them to the message list.
      const oldest = firstMsg.createdAt;
      const q = query(
        messagesCollection,
        orderBy('createdAt', 'desc'),
        startAfter(Timestamp.fromDate(oldest)),
        limit(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const olderDesc = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Message[];

        const olderMessages = olderDesc.reverse();

        setMessages(prev => [...olderMessages, ...prev]);

        // Restore scroll position
        // Wait for DOM update
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            scrollContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error loading more messages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  const otherUserId = (chat: Chat) => {
    return chat.participants.find(uid => uid !== user?.uid) || chat.participants[0];
  };

  const { setSending } = useNotifications();

  const sendChatMessage = async () => {
    if (!selectedChat || !user || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately

    const tempId = doc(collection(db, `chats/${selectedChat.id}/messages`)).id; // Pre-generate ID
    const timestamp = new Date();

    const optimisticMessage: Message = {
      id: tempId,
      chatId: selectedChat.id,
      senderId: user.uid,
      senderUsername: user.username,
      senderDisplayName: user.displayName,
      senderPhotoURL: user.photoURL,
      content: messageContent,
      createdAt: timestamp,
      read: false,
      status: 'sending'
    };

    // Optimistic Update: Add immediately to state
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom(true);
    // Optimistically move the chat to the top and update lastMessage/time
    setChats(prev => {
      if (!selectedChat) return prev;
      const others = prev.filter(c => c.id !== selectedChat.id);
      const updatedChat = {
        ...selectedChat,
        lastMessage: messageContent,
        lastMessageTime: timestamp,
      } as Chat;
      return [updatedChat, ...others];
    });

    // Set global sending state
    setSending(true);

    try {
      const messageRef = doc(db, `chats/${selectedChat.id}/messages`, tempId);
      const chatRef = doc(db, 'chats', selectedChat.id);

      await Promise.all([
        setDoc(messageRef, {
          ...optimisticMessage,
          createdAt: serverTimestamp(), // Use server timestamp for consistency
          status: 'sent' // It will be 'sending' in pending state
        }),
        // Update the chat document. Use the local `timestamp` so the UI ordering
        // reflects the new message immediately on all clients.
        updateDoc(chatRef, {
          lastMessage: messageContent,
          lastMessageTime: timestamp,
          [`unreadCounts.${otherUserId(selectedChat)}`]: increment(1)
        })
      ]);

      // No need to scroll here again as we did it optimistically
    } catch (error) {
      console.error("Error sending message", error);
      toast.error("Failed to send message");
      // Rollback optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const sendAIMessage = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setAIMessages(prev => [...prev, userMsg]);
    setAILoading(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
      });

      const data = await response.json();
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.result || "I'm sorry, I couldn't process that.",
        createdAt: new Date(),
      };
      setAIMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error sending AI message:', error);
      toast.error("Failed to get AI response");
    } finally {
      setAILoading(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAISelected) {
      sendAIMessage();
    } else {
      sendChatMessage();
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherUid = otherUserId(chat);
    const details = chat.participantDetails?.[otherUid];
    const name = details?.displayName || 'Unknown';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${isConversationOpen ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-96 flex-col border-r border-gray-200 bg-white`}>
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* AI Chat Option */}
          <div
            onClick={() => {
              setIsAISelected(true);
              setSelectedChat(null);
              setIsConversationOpen(true);
            }}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${isAISelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                <RiRobot2Line className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Celebra AI</h3>
                <p className="text-xs text-blue-600 font-medium">Always here to help</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            filteredChats.map(chat => {
              const otherUid = otherUserId(chat);
              const details = chat.participantDetails?.[otherUid] || { displayName: 'Unknown', photoURL: '', username: 'unknown' };
              const unread = unreadCounts[chat.id] || 0;
              const isSelected = selectedChat?.id === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                    setIsAISelected(false);
                    setIsConversationOpen(true);
                  }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {details.photoURL ? (
                        <Image
                          src={details.photoURL}
                          alt={details.displayName}
                          width={48}
                          height={48}
                          className="rounded-full object-cover w-12 h-12 border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {details.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      {/* Online status indicator could go here */}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{details.displayName}</h3>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation Window */}
      <div className={`${isConversationOpen ? 'flex' : 'hidden sm:flex'} flex-1 flex-col bg-gray-50`}>
        {isAISelected ? (
          <>
            {/* AI Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center shadow-sm z-10">
              <button onClick={() => setIsConversationOpen(false)} className="sm:hidden mr-4 text-gray-600">
                <FiArrowLeft className="text-xl" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white mr-3">
                <RiRobot2Line />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Celebra AI</h2>
                <p className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>Online</p>
              </div>
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 shadow-sm rounded-tl-none border border-gray-100'
                    }`}>
                    <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                      {msg.content}
                    </ReactMarkdown>
                    <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center">
                <button onClick={() => setIsConversationOpen(false)} className="sm:hidden mr-4 text-gray-600">
                  <FiArrowLeft className="text-xl" />
                </button>
                {(() => {
                  const otherUid = otherUserId(selectedChat);
                  const details = selectedChat.participantDetails?.[otherUid] || { displayName: 'Unknown', photoURL: '' };
                  return (
                    <>
                      <div className="relative">
                        {details.photoURL ? (
                          <Image src={details.photoURL} alt={details.displayName} width={40} height={40} className="rounded-full object-cover w-10 h-10 border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {details.displayName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h2 className="font-bold text-gray-900">{details.displayName}</h2>
                        <p className="text-xs text-gray-500">Active recently</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                <FiMoreVertical />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.uid;
                const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    {!isMe && (
                      <div className="w-8 mr-2 flex-shrink-0">
                        {showAvatar && (
                          msg.senderPhotoURL ? (
                            <Image src={msg.senderPhotoURL} alt={msg.senderDisplayName} width={32} height={32} className="rounded-full w-8 h-8 object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs text-white font-bold">
                              {msg.senderDisplayName?.[0]?.toUpperCase()}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex flex-col max-w-[75%]">
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm break-words ${isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                          }`}
                      >
                        {msg.content}
                      </div>

                      <div className={`flex items-center mt-1 space-x-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400">
                          {msg.createdAt ? formatDistanceToNow(msg.createdAt, { addSuffix: true }) : 'Just now'}
                        </span>
                        {isMe && (
                          <span className="text-[10px]">
                            {msg.status === 'sending' && <span className="text-gray-400 italic">Sending...</span>}
                            {msg.status === 'failed' && <span className="text-red-500">Failed</span>}
                            {msg.status === 'sent' && (
                              msg.read ? <span className="text-blue-500 font-bold">Read</span> : <FiCheck className="text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiSend className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
            <p className="max-w-md">Select a chat from the sidebar or start a new conversation to get connected.</p>
            <button
              onClick={() => setIsAISelected(true)}
              className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Chat with AI Assistant
            </button>
          </div>
        )}

        {/* Input Area */}
        {(selectedChat || isAISelected) && (
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex items-end space-x-2 max-w-4xl mx-auto">
              <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-gray-900 placeholder-gray-500"
                  rows={1}
                  style={{ minHeight: '2.5rem' }}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <FiSend className="text-lg" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
