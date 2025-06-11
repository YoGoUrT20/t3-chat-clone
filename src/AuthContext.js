import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
        if (userSnap.exists()) {
          const data = userSnap.data();
          key = data.apiKey;
          publicId = data.public_id;
        }
        if (!key) {
          key = [...Array(48)].map(() => Math.random().toString(36)[2]).join('');
        }
        if (!publicId) {
          publicId = uuidv4();
        }
        await setDoc(userRef, { apiKey: key, public_id: publicId }, { merge: true });
        setApiKey(key);
        localStorage.setItem('apiKey', key);
        // Merge public_id into user object for context
        const mergedUser = { ...firebaseUser, public_id: publicId };
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