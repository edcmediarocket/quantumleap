
// --- functions/investmentCoachAgent.ts ---
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const investmentCoachAgent = onRequest(async (req, res) => {
  // Set CORS headers
  // For development, '*' is often used. For production, restrict this to your app's domain.
  res.set('Access-Control-Allow-Origin', '*'); 
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization if you plan to use it

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  console.log('investmentCoachAgent function invoked. Request body keys:', Object.keys(req.body).join(', '));
  try {
    const { userId, userPrompt, aiResult } = req.body;

    // More detailed logging for received data
    console.log(`Received userId: ${userId ? `Present (value: ${userId})` : 'MISSING!'}`);
    console.log(`Received userPrompt: ${userPrompt ? 'Present' : 'MISSING!'}`);
    // For aiResult, which can be large, just log its presence or a snippet if needed
    console.log(`Received aiResult: ${aiResult ? `Present (type: ${typeof aiResult}, length: ${String(aiResult).length})` : 'MISSING!'}`);


    if (!userId || !userPrompt || !aiResult) {
      console.error('Validation Error: Missing required fields in request body.', {
          bodyReceived: req.body, // Log the whole body for debugging missing fields
          userIdProvided: !!userId,
          userPromptProvided: !!userPrompt,
          aiResultProvided: !!aiResult
      });
      res.status(400).send({ error: 'Missing required fields: userId, userPrompt, or aiResult.' });
      return;
    }

    console.log(`Attempting to log to coachLogs for userId: ${userId}`);
    await admin.firestore().collection('coachLogs').add({
      userId,
      userPrompt, // What the user initiated/configured
      aiResult,   // The stringified JSON result from Genkit
      timestamp: new Date().toISOString(),
    });
    console.log('Successfully logged to coachLogs.');

    res.status(200).send({ success: true, message: 'Log received and processed.' });

  } catch (error) {
    console.error("Critical Error in investmentCoachAgent during Firestore operation:", error);
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
    } else {
        console.error("Unknown error structure:", error);
    }
    // Ensure CORS headers are also set on error responses
    res.status(500).send({ error: 'Failed to log AI interaction due to an internal server error.' });
  }
});
