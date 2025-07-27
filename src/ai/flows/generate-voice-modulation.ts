// Talking Sales Agents - Cleverly AI Sales Simulation

'use server';
/**
 * @fileOverview A Generative Voice Modulation AI agent using Deepgram TTS.
 *
 * - generateVoiceModulation - A function that handles the voice modulation process.
 * - GenerateVoiceModulationInput - The input type for the generateVoiceModulation function.
 * - GenerateVoiceModulationOutput - The return type for the generateVoiceModulation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateVoiceModulationInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  speaker: z.enum(['salesperson_agent', 'consumer_agent']).describe('The speaker of the text.'),
  tone: z.string().optional().describe('The tone of the text (e.g., confident, skeptical).'),
});

export type GenerateVoiceModulationInput = z.infer<
  typeof GenerateVoiceModulationInputSchema
>;

const GenerateVoiceModulationOutputSchema = z.object({
  media: z.string().describe('The audio data in WAV format as a data URI.'),
});

export type GenerateVoiceModulationOutput = z.infer<
  typeof GenerateVoiceModulationOutputSchema
>;

export async function generateVoiceModulation(
  input: GenerateVoiceModulationInput
): Promise<GenerateVoiceModulationOutput> {
  return generateVoiceModulationFlow(input);
}

const voiceModels = {
  salesperson_agent: {
    default: 'Algenib',
    confident: 'Algenib',
    friendly: 'Algenib',
    professional: 'Algenib',
  },
  consumer_agent: {
    default: 'Achernar',
    skeptical: 'Achernar',
    curious: 'Achernar',
    interested: 'Achernar',
    doubtful: 'Achernar',
  },
};

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateVoiceModulationFlow = ai.defineFlow(
  {
    name: 'generateVoiceModulationFlow',
    inputSchema: GenerateVoiceModulationInputSchema,
    outputSchema: GenerateVoiceModulationOutputSchema,
  },
  async input => {
    const voiceName = voiceModels[input.speaker][input.tone ?? 'default'];

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName},
          },
        },
      },
      prompt: input.text,
    });

    if (!media) {
      throw new Error('No media returned from TTS.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);
