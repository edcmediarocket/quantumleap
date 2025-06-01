
// --- functions/index.ts ---
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { investmentCoachAgent as coachAgentV2 } from './investmentCoachAgent'; // V2 function
import { sendPushToAll } from './push'; // Assuming saveDailySignal is also in push or firestore
import { saveDailySignal } from './firestore'; // Corrected import

admin.initializeApp();

// Export V2 function with a different name if original 'investmentCoachAgent' is needed for v1
export const investmentCoachAgent = coachAgentV2;

// Scheduled function (uses v1 SDK structure for pubsub.schedule)
export const runSignalJob = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log('runSignalJob triggered');
  try {
    const signal = `AI Pick at ${new Date().toISOString()} (from scheduled job)`;
    await saveDailySignal(signal);
    await sendPushToAll(signal);
    console.log('Signal job completed successfully.');
    return null; // Required for scheduled functions
  } catch (error) {
    console.error('Error in runSignalJob:', error);
    return null; // Required for scheduled functions
  }
});

// HTTP function (uses v1 SDK structure for https.onRequest)
export const pushSignal = functions.https.onRequest(async (req, res) => {
  console.log('pushSignal triggered with body:', req.body);
  try {
    const { signal } = req.body;
    if (!signal) {
      console.error('Signal not provided in request body');
      res.status(400).send({ error: 'Signal not provided' });
      return;
    }
    await saveDailySignal(signal);
    await sendPushToAll(signal);
    console.log('Signal pushed successfully:', signal);
    res.status(200).send({ status: 'pushed', signal });
  } catch (error) {
    console.error('Error in pushSignal:', error);
    res.status(500).send({ error: 'Failed to push signal' });
  }
});
