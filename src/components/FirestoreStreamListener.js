import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function FirestoreStreamListener({ streamId, messageId, onUpdate, children }) {
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!streamId || !messageId) return;
    const streamDocRef = doc(db, 'streams', streamId);
    unsubRef.current = onSnapshot(streamDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.messageid === messageId) {
          onUpdate && onUpdate({ message: data.message, finished: data.finished });
        }
        if (typeof children === 'function') {
          children({ message: data.message, finished: data.finished });
        }
      }
    });
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [streamId, messageId, onUpdate, children]);

  return null;
}

export default FirestoreStreamListener; 