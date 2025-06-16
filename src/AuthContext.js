import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize user from localStorage if available
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(false);
      if (firebaseUser) {
        // Firestore logic for API key and public_id
        const db = getFirestore();
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let key = null;
        let publicId = null;
        let createdAt = null;
        let status = 'free';
        if (userSnap.exists()) {
          const data = userSnap.data();
          key = data.apiKey;
          publicId = data.public_id;
          createdAt = data.createdAt;
          status = data.status || 'free';
        }
        if (!key) {
          key = [...Array(48)].map(() => Math.random().toString(36)[2]).join('');
        }
        if (!publicId) {
          publicId = uuidv4();
        }
        // Save createdAt only if it does not exist
        if (!createdAt) {
          createdAt = Date.now();
        }
        // Always ensure user doc exists with at least status: 'free'
        await setDoc(userRef, { apiKey: key, public_id: publicId, createdAt, status }, { merge: true });
        setApiKey(key);
        localStorage.setItem('apiKey', key);
        // Merge public_id and uid into user object for context
        const mergedUser = { ...firebaseUser, public_id: publicId, uid: firebaseUser.uid, status };
        setUser(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('apiKey');
        setApiKey(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err && err.code === 'auth/missing-project-id') {
        toast.error('Login failed: Firebase project ID is missing or misconfigured.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser, apiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 