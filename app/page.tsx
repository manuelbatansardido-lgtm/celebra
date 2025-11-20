'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Auth from '@/components/Auth';
import Feed from '@/components/Feed';

import FriendSuggestionsWidget from '@/components/FriendSuggestionsWidget';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Celebra...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Feed />
        </div>
        <div className="hidden lg:block">
          <FriendSuggestionsWidget maxSuggestions={3} />
        </div>
      </div>
    </div>
  );
}
