
// --- functions/push.ts ---
import * as admin from 'firebase-admin';
import { getAllUsers } from './firestore';

// Ensure Firebase Admin is initialized (similar to firestore.ts)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const sendPushToAll = async (signal: string) => {
  console.log('Preparing to send push notification for signal:', signal);
  try {
    const users = await getAllUsers();
    const tokens: string[] = [];
    
    if (!users || users.length === 0) {
      console.log('No users found to send notifications.');
      return;
    }

    for (const user of users) {
      // Access preferences safely, user or preferences might be undefined
      const preferences = user.preferences as { notifications?: boolean } | undefined;
      const fcmToken = user.fcmToken as string | undefined;

      if (preferences?.notifications && fcmToken) {
        tokens.push(fcmToken);
      }
    }

    const message = {
      notification: {
        title: '🚀 Quantum Leap Signal', // Updated title
        body: signal,
      },
      tokens,
    };

    if (tokens.length > 0) {
      console.log(`Sending push notification to ${tokens.length} tokens.`);
      const response = await admin.messaging().sendMulticast(message);
      console.log('Successfully sent message:', response.successCount, 'successes,', response.failureCount, 'failures.');
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${tokens[idx]}: ${resp.error}`);
          }
        });
      }
    } else {
      console.log('No users with notifications enabled or FCM tokens found.');
    }
  } catch (error) {
    console.error('Error in sendPushToAll:', error);
    // Do not re-throw here if this is part of a larger job that should continue
  }
};
