'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  createUserWithUsername: (firebaseUser: FirebaseUser, username: string, displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ 
            uid: firebaseUser.uid,
            ...userDoc.data() as Omit<User, 'uid'>
          });
        } else {
          // User authenticated but no profile - needs to complete signup
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username.toLowerCase())
    );
    const querySnapshot = await getDocs(usernameQuery);
    return querySnapshot.empty;
  };

  const createUserWithUsername = async (firebaseUser: FirebaseUser, username: string, displayName?: string) => {
    const finalDisplayName = displayName || firebaseUser.displayName || username;
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      username: username.toLowerCase(),
      displayName: finalDisplayName,
      displayNameLower: finalDisplayName.toLowerCase(),
      photoURL: firebaseUser.photoURL || '',
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    setUser(userData);
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;

    const updatedData = {
      ...data,
      displayNameLower: data.displayName ? data.displayName.toLowerCase() : user.displayName.toLowerCase(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    setUser({ ...user, ...updatedData } as User);
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    checkUsernameAvailable,
    createUserWithUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
