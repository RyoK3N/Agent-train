
// src/ai/flows/analyze-performance-flow.ts
'use server';

/**
 * @fileOverview A flow to analyze a sales conversation and provide detailed feedback.
 *
 * - analyzePerformance - A function that handles the performance analysis.
 * - AnalyzePerformanceInput - The input type for the analyzePerformance function.
 * - AnalyzePerformanceOutput - The return type for the analyzePerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePerformanceInputSchema = z.object({
  transcript: z
    .string()
    .describe('The full transcript of the sales conversation.'),
  salesAgentPrompt: z
    .string()
    .describe('The system prompt that defined the sales agent\'s goals and methodology.'),
});

export type AnalyzePerformanceInput = z.infer<typeof AnalyzePerformanceInputSchema>;

const AnalyzePerformanceOutputSchema = z.object({
  overallScore: z.number().describe('A score from 0 to 100 representing the overall performance.'),
  feedback: z.string().describe('A detailed, constructive feedback summary for the sales agent, formatted in Markdown.'),
  strengths: z.array(z.string()).describe('A list of key strengths from the conversation.'),
  areasForImprovement: z.array(z.string()).describe('A list of key areas for improvement.'),
});

export type AnalyzePerformanceOutput = z.infer<typeof AnalyzePerformanceOutputSchema>;

export async function analyzePerformance(input: AnalyzePerformanceInput): Promise<AnalyzePerformanceOutput> {
  return analyzePerformanceFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'analysisPrompt',
  input: {
    schema: AnalyzePerformanceInputSchema,
  },
  output: {
    schema: AnalyzePerformanceOutputSchema,
  },
  system: `You are an expert sales coach. Your task is to analyze a sales conversation transcript and provide a detailed performance review for the human sales agent.

- Evaluate the agent's performance based on the provided Sales Agent Prompt, which outlines their objectives and methodology.
- Assess key areas such as rapport building, discovery questions, value propositioning, objection handling, and closing.
- Provide a clear, honest, and constructive feedback summary.
- Generate an overall performance score from 0 to 100.
- Identify specific strengths and areas for improvement.
- Ensure the feedback is formatted in Markdown for easy readability.
- You must return a JSON object that adheres to the provided schema.`,
  prompt: `
**Sales Agent's Goals & Methodology:**
---
{{salesAgentPrompt}}
---

**Conversation Transcript:**
---
{{transcript}}
---

Please provide your detailed performance analysis.
`,
});

const analyzePerformanceFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceFlow',
    inputSchema: AnalyzePerformanceInputSchema,
    outputSchema: AnalyzePerformanceOutputSchema,
  },
  async input => {
    const {output} = await analysisPrompt(input);
    return output!;
  }
);
