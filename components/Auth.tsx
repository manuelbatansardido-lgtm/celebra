'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { auth } from '@/lib/firebase';

export default function Auth() {
  const { signInWithGoogle, checkUsernameAvailable, createUserWithUsername } = useAuth();
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      setShowUsernameInput(true);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const available = await checkUsernameAvailable(username);
      if (!available) {
        setError('Username is already taken');
        return;
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        await createUserWithUsername(currentUser, username, displayName);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Celebra
            </h1>
            <p className="text-gray-600">Connect with friends and share your moments</p>
          </div>

          {!showUsernameInput ? (
            // Google Sign In
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="text-2xl" />
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            // Display Name and Username Input
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  This is the name that will be shown to other users
                </p>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Username must be at least 3 characters and contain only letters, numbers, and underscores
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Profile...' : 'Complete Signup'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
