// src/ai/flows/customize-roleplay-configuration.ts
'use server';

/**
 * @fileOverview A flow to customize roleplay configurations by setting system prompts and injecting conversation snippets.
 *
 * - customizeRoleplay - A function that handles the customization of roleplay configurations.
 * - CustomizeRoleplayInput - The input type for the customizeRoleplay function.
 * - CustomizeRoleplayOutput - The return type for the customizeRoleplay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeRoleplayInputSchema = z.object({
  salesAgentPrompt: z
    .string()
    .describe('The system prompt for the sales agent.')
    .optional(),
  consumerAgentPrompt: z
    .string()
    .describe('The system prompt for the consumer agent.')
    .optional(),
  externalKnowledgeUrl: z
    .string()
    .describe('URL to external document for conversation snippets.')
    .optional(),
  query: z.string().describe('The user query or task for the agents.'),
});

export type CustomizeRoleplayInput = z.infer<typeof CustomizeRoleplayInputSchema>;

const CustomizeRoleplayOutputSchema = z.object({
  salesAgentResponse: z.string().describe('The response from the sales agent.'),
  consumerAgentResponse: z
    .string()
    .describe('The response from the consumer agent.'),
});

export type CustomizeRoleplayOutput = z.infer<typeof CustomizeRoleplayOutputSchema>;

export async function customizeRoleplay(input: CustomizeRoleplayInput): Promise<CustomizeRoleplayOutput> {
  return customizeRoleplayFlow(input);
}

const knowledgeInjectionTool = ai.defineTool({
  name: 'getRelevantKnowledge',
  description: 'Retrieves relevant conversation snippets from an external document or URL based on the current context.',
  inputSchema: z.object({
    query: z.string().describe('The query to use to find relevant snippets.'),
  }),
  outputSchema: z.string().describe('Relevant conversation snippets from the external source.'),
},
async (input) => {
  // TODO: Implement fetching snippets from externalKnowledgeUrl using the query.
  // This is a placeholder; replace with actual implementation.
  console.log(`Fetching knowledge for query: ${input.query}`);
  return `PLACEHOLDER: Relevant knowledge for ${input.query} from external source.`
});

const roleplayPrompt = ai.definePrompt({
  name: 'roleplayPrompt',
  tools: [knowledgeInjectionTool],
  input: {
    schema: CustomizeRoleplayInputSchema,
  },
  output: {
    schema: CustomizeRoleplayOutputSchema,
  },
  system: `You must return a JSON object that adheres to the provided schema.`,
  prompt: `You are simulating a conversation between a sales agent and a consumer agent.

Sales Agent System Prompt:
{{salesAgentPrompt}}

Consumer Agent System Prompt:
{{consumerAgentPrompt}}

External Knowledge URL: {{externalKnowledgeUrl}}

User Query: {{query}}


Based on the user query, each agent should respond in turn, incorporating relevant information from the external knowledge source when appropriate. Use the getRelevantKnowledge tool when the conversation requires more information, but do not overuse it. Make sure the getRelevantKnowledge tool inputs are detailed and of a high quality so that only the most important information is returned.

Sales Agent Response:

Consumer Agent Response:`,
});

const customizeRoleplayFlow = ai.defineFlow(
  {
    name: 'customizeRoleplayFlow',
    inputSchema: CustomizeRoleplayInputSchema,
    outputSchema: CustomizeRoleplayOutputSchema,
  },
  async input => {
    const {
      salesAgentPrompt,
      consumerAgentPrompt,
      externalKnowledgeUrl,
      query,
    } = input;

    const {output} = await roleplayPrompt({
      salesAgentPrompt: salesAgentPrompt || 'You are a sales agent.',
      consumerAgentPrompt: consumerAgentPrompt || 'You are a consumer agent.',
      externalKnowledgeUrl: externalKnowledgeUrl || '',
      query,
    });

    return output!;
  }
);
