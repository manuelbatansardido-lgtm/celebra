'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// AI requests are handled server-side via `/api/ai/generate` route
import { FiSend } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiCopy } from 'react-icons/fi';

interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
  modelUsed?: string;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use only Gemini 2.5 Flash as requested
  const MODEL_NAME = 'gemini-2.5-flash';

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Load initial welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'ai',
        content: `Hello ${user.displayName}! 👋 I'm Celebra AI, your intelligent assistant. I can help you with:\n\n• Answering questions with detailed explanations\n• Creating numbered lists and bullet points\n• Organizing information in tables\n• Providing step-by-step guides\n• And much more!\n\nWhat would you like to know today?`,
        createdAt: new Date(),
        modelUsed: 'System',
      }]);
    }
  }, [user, router, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim(), format: 'rich' }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `AI server error (${res.status})`);
      }

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || '',
        createdAt: new Date(),
        modelUsed: data.model || 'server',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI client error:', error?.message || error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: error?.message || 'AI error',
        createdAt: new Date(),
        modelUsed: 'Error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Check for headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mt-2 mb-1">{line.substring(4)}</h3>;
      }

      // Check for bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>;
      }

      // Check for numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        return <li key={index} className="ml-4 mb-1">{line.substring(numberedMatch[0].length)}</li>;
      }

      // Check for bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </p>
        );
      }

      // Regular line
      if (line.trim()) {
        return <p key={index} className="mb-2">{line}</p>;
      }

      return <br key={index} />;
    });
  };
  const handleCopy = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const cid = id || Date.now().toString();
      setCopiedId(cid);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <RiRobot2Line className="text-2xl text-purple-600" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Celebra AI</h2>
                <p className="text-purple-100 text-sm">Powered by Gemini</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl ${message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg px-4 py-3'
                    : 'bg-gray-100 text-gray-900 rounded-lg px-4 py-3 pr-10'
                    }`}
                >
                  {message.role === 'ai' && (
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-300">
                      <RiRobot2Line className="text-purple-600" />
                      <span className="font-semibold text-sm text-purple-600">Celebra AI</span>
                      {message.modelUsed && message.modelUsed !== 'System' && (
                        <span className="text-xs text-gray-500">({message.modelUsed})</span>
                      )}
                    </div>
                  )}

                  <div className={message.role === 'ai' ? 'prose max-w-none relative' : ''}>
                    {message.role === 'ai' ? (
                      <>
                        <div className="absolute right-0 top-0 flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            title="Copy"
                            className="text-gray-400 hover:text-gray-700 p-1"
                          >
                            <FiCopy />
                          </button>
                          {copiedId === message.id && (
                            <span className="text-xs text-green-600 mr-2">Copied!</span>
                          )}
                        </div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                  </div>

                  <p
                    className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                  >
                    {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <RiRobot2Line className="text-purple-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Celebra AI anything..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiSend />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Celebra AI can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
