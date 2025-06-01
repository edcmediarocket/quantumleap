
// --- functions/investmentCoachAgent.ts ---
import { onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const investmentCoachAgent = onRequest(async (req, res) => {
  try {
    const { userId, prompt } = req.body;
    const result = await generateAIResponse(prompt); // mock

    await admin.firestore().collection('coachLogs').add({
      userId,
      prompt,
      result,
      timestamp: new Date().toISOString(),
    });

    res.status(200).send({ result });
  } catch (error) {
    console.error("Error in investmentCoachAgent:", error);
    // It's good practice to log the actual error on the server
    // And throw a more generic HttpsError to the client
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to run agent');
  }
});

async function generateAIResponse(prompt: string): Promise<string> {
  // In a real scenario, this would call your Genkit flows or another AI service
  console.log(`Generating AI response for prompt: ${prompt}`);
  return `AI response for: ${prompt}`;
}
