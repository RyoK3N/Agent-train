
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
  salesAgentResponse: z.string().describe('The response from the sales agent. This might be an empty string if it is not the sales agent\'s turn.'),
  consumerAgentResponse: z
    .string()
    .describe('The response from the consumer agent. This might be an empty string if it is not the consumer agent\'s turn.'),
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
  // In a real implementation, you would fetch and process the content from input.url
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
  system: `You are an expert conversation simulator. Your task is to generate the next turn in a roleplay conversation between a sales agent and a consumer agent based on their defined prompts and the conversation history.

- Analyze the 'User Query' to understand whose turn it is and what the context is.
- Generate a response for ONLY the agent whose turn it is. The other agent's response should be an empty string.
- The response should be realistic, adhering to the agent's personality, goals, and communication style defined in their system prompt.
- Ensure responses include tone indicators like *confident* or *skeptical* at the beginning.
- If an agent decides the conversation is over (e.g., a meeting is booked), their response MUST include the word 'TERMINATE'.
- You must return a JSON object that adheres to the provided schema.`,
  prompt: `
Sales Agent System Prompt:
{{salesAgentPrompt}}

Consumer Agent System Prompt:
{{consumerAgentPrompt}}

External Knowledge URL (if provided): {{externalKnowledgeUrl}}

Conversation Context / User Query: 
{{query}}

Generate the next response in the conversation.
`,
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
      salesAgentPrompt: salesAgentPrompt || 'You are a helpful sales agent.',
      consumerAgentPrompt: consumerAgentPrompt || 'You are a skeptical customer.',
      externalKnowledgeUrl: externalKnowledgeUrl || '',
      query,
    });

    return output!;
  }
);
