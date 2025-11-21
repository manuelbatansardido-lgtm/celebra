'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '../logo.png';
import { FiHome, FiMessageCircle, FiUsers, FiUser, FiLogOut, FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useState } from 'react';

import { useNotifications } from '@/contexts/NotificationContext';
import AboutPopup from './AboutPopup';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { unreadMessagesCount, friendRequestsCount } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileMenu(false);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
            <Image src={logo} alt="Celebra" width={40} height={40} className="rounded-md" />
            <span className="ml-2 text-lg font-bold text-gray-900 hidden sm:inline">Celebra</span>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </form>

          {/* Desktop Navigation Icons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Home"
            >
              <FiHome className="text-xl text-gray-700" />
            </button>

            <button
              onClick={() => router.push('/friends')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              title="Friends"
            >
              <FiUsers className="text-xl text-gray-700" />
              {friendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{friendRequestsCount}</span>
              )}
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              title="Messages"
            >
              <FiMessageCircle className="text-xl text-gray-700" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{unreadMessagesCount}</span>
              )}
            </button>

            {/* Global Sending Indicator */}
            {useNotifications().isSending && (
              <div className="flex items-center px-2 py-1 bg-blue-50 rounded-full border border-blue-100 animate-pulse" title="Sending message...">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-xs font-medium text-blue-600">Sending...</span>
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200">
                  <button
                    onClick={() => {
                      router.push(`/profile/${user?.uid}`);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FiUser className="text-gray-600" />
                    <span>Profile</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                  >
                    <FiLogOut />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* About Popup Trigger */}
            <div>
              <AboutPopup />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? (
                <FiX className="text-2xl text-gray-700" />
              ) : (
                <FiMenu className="text-2xl text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-2 mb-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  router.push('/');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3"
              >
                <FiHome className="text-xl text-gray-700" />
                <span className="font-medium">Home</span>
              </button>

              <button
                onClick={() => {
                  router.push('/friends');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3"
              >
                <div className="relative">
                  <FiUsers className="text-xl text-gray-700" />
                  {friendRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{friendRequestsCount}</span>
                  )}
                </div>
                <span className="font-medium">Friends</span>
              </button>

              <button
                onClick={() => {
                  router.push('/messages');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3"
              >
                <div className="relative">
                  <FiMessageCircle className="text-xl text-gray-700" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{unreadMessagesCount}</span>
                  )}
                </div>
                <span className="font-medium">Messages</span>
              </button>

              <button
                onClick={() => {
                  router.push(`/profile/${user?.uid}`);
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3"
              >
                <FiUser className="text-gray-700 text-xl" />
                <span className="font-medium">Profile</span>
              </button>

              <hr className="my-2" />

              <div className="px-2">
                <AboutPopup />
              </div>

              <button
                onClick={() => {
                  handleSignOut();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 text-red-600"
              >
                <FiLogOut className="text-xl" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
