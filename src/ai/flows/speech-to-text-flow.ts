
'use server';
/**
 * @fileOverview A flow to convert speech to text using Deepgram.
 *
 * - speechToText - A function that handles the speech-to-text conversion.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createClient } from '@deepgram/sdk';

// Ensure you have DEEPGRAM_API_KEY in your .env file
if (!process.env.DEEPGRAM_API_KEY) {
    console.warn("DEEPGRAM_API_KEY is not set. Speech-to-text will not function.");
}

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data to transcribe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;


const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error("Deepgram API key is not configured.");
    }
    
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    
    const base64Audio = input.audioDataUri.split(',')[1];
    const buffer = Buffer.from(base64Audio, 'base64');

    try {
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            buffer,
            {
                model: 'nova-2',
                smart_format: true,
            }
        );

        if (error) {
            console.error("Deepgram transcription error:", error);
            throw new Error(`Deepgram error: ${error.message}`);
        }

        return { transcript: result.results.channels[0].alternatives[0].transcript };
    } catch (e: any) {
        console.error("Error calling Deepgram API:", e);
        throw new Error("Failed to transcribe audio.");
    }
  }
);

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}
