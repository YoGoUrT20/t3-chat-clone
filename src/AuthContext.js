import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
      setUser(firebaseUser);
      setLoading(false);
      // Update localStorage with the latest user
      if (firebaseUser) {
        localStorage.setItem('user', JSON.stringify(firebaseUser));
        // Firestore logic for API key
        const db = getFirestore();
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let key = null;
        if (userSnap.exists() && userSnap.data().apiKey) {
          key = userSnap.data().apiKey;
        } else {
          // Generate a random API key
          key = [...Array(48)].map(() => Math.random().toString(36)[2]).join('');
          await setDoc(userRef, { apiKey: key }, { merge: true });
        }
        setApiKey(key);
        localStorage.setItem('apiKey', key);
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('apiKey');
        setApiKey(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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