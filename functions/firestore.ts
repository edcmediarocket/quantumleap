
// --- functions/firestore.ts ---
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized. 
// If it's initialized elsewhere (e.g. index.ts), this might not be needed
// or could be conditional: if (admin.apps.length === 0) { admin.initializeApp(); }
// For simplicity with current structure where index.ts also initializes:
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const getAllUsers = async () => {
  console.log('Fetching all users from Firestore');
  try {
    const snap = await db.collection('users').get();
    const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${users.length} users.`);
    return users;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error; // Re-throw or handle as appropriate
  }
};

export const saveDailySignal = async (signal: string) => {
  console.log('Saving daily signal to Firestore:', signal);
  try {
    const signalRef = await db.collection('dailySignals').add({
      strategy: signal,
      createdAt: new Date().toISOString(),
    });
    console.log('Signal saved with ID:', signalRef.id);
    return signalRef;
  } catch (error) {
    console.error('Error in saveDailySignal:', error);
    throw error;
  }
};
