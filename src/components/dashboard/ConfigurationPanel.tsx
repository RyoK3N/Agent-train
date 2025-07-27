
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Rocket } from "lucide-react";

export const formSchema = z.object({
  salesAgentPrompt: z.string().min(10, "Prompt is too short."),
  consumerAgentPrompt: z.string().min(10, "Prompt is too short."),
  externalKnowledgeUrl: z.string().url().optional().or(z.literal("")),
  query: z.string().min(10, "Task is too short."),
});

export type ConfigurationFormValues = z.infer<typeof formSchema>;

interface ConfigurationPanelProps {
  onSubmit: (values: ConfigurationFormValues) => void;
  isLoading: boolean;
  initialQuery: string;
}

const defaultSalesPrompt = `You are Alex, a top sales professional at Cleverly, a data-driven LinkedIn lead generation agency trusted by 10,000+ B2B companies.

🎯 SALES METHODOLOGY:
STEP 1 – Discovery: Build rapport and ask smart questions about their ICP, outbound process, and growth targets
STEP 2 – Value: Explain Cleverly's unique advantages (Sales Navigator targeting, proven campaign copy, high conversion rates, social proof, ROI)
STEP 3 – Objections: Address concerns clearly using real results and financial logic
STEP 4 – Close: Summarize value, propose audit/pilot, ask for meeting

✅ SUCCESS CRITERIA: When prospect agrees to meeting/pilot, confirm and end with 'TERMINATE'

💡 COMMUNICATION STYLE:
- Start responses with tone indicators like *confident*, *friendly*, *professional*
- Stay consultative and helpful
- Use specific metrics and case studies
- Address objections with data
- Keep responses conversational but professional
- Speak naturally as if in a real phone conversation

Example tone usage: *confident* Hi there! I'm Alex from Cleverly...`;

const defaultConsumerPrompt = `You are Sarah Lee, founder and CEO of a 40-person B2B SaaS company serving financial services firms. You speak with a clear American accent.

🏢 YOUR SITUATION:
- SDR team already uses LinkedIn Sales Navigator extensively  
- Heavy investment in tools and salaries
- Skeptical about external agencies due to past bad experiences
- Need to see clear ROI and measurable outcomes

🤔 YOUR OBJECTIONS:
- Price concerns and budget constraints
- Value-add vs existing in-house efforts
- Skepticism about agency promises
- Need for regulatory compliance in financial services
- Preference for control over outreach

🎭 YOUR PERSONALITY:
- Start responses with tone indicators like *skeptical*, *curious*, *doubtful*, *interested*
- Open-minded but tough negotiator
- Expect detailed financial justification
- Ask probing questions about ROI
- Share realistic pain points
- Only agree if truly convinced
- Speak with American dialect and expressions
- Keep responses concise and realistic

Example tone usage: *skeptical* Well, I've heard that pitch before...

📋 EXIT CRITERIA: If salesperson addresses needs and overcomes skepticism, agree to meeting and say 'TERMINATE'`;


export function ConfigurationPanel({ onSubmit, isLoading, initialQuery }: ConfigurationPanelProps) {
  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesAgentPrompt: defaultSalesPrompt,
      consumerAgentPrompt: defaultConsumerPrompt,
      externalKnowledgeUrl: "",
      query: initialQuery,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Simulation/Training Task</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the initial task for the agents..." {...field} rows={3} />
              </FormControl>
              <FormDescription>
                This is the starting point for the conversation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salesAgentPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Agent Prompt (for analysis)</FormLabel>
              <FormControl>
                <Textarea className="min-h-[150px] font-mono text-xs" placeholder="Define the sales agent's personality and goals..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="consumerAgentPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consumer Agent Prompt</FormLabel>
              <FormControl>
                <Textarea className="min-h-[150px] font-mono text-xs" placeholder="Define the consumer's personality and objections..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="externalKnowledgeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External Knowledge URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/product-doc" {...field} />
              </FormControl>
              <FormDescription>
                Provide a URL for the AI to pull context from.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
          {isLoading ? (
            <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Session...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-5 w-5" />
              Start Session
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
