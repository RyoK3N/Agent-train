
import type { AnalyzePerformanceOutput } from '@/ai/flows/analyze-performance-flow';

export interface Message {
  id: string;
  speaker: "salesperson_agent" | "consumer_agent" | "user";
  text: string;
  isGeneratingAudio?: boolean;
  audioData?: string;
  tone?: string;
}

export interface Stats {
  totalMessages: number;
  meetingBooked: boolean;
  conversationLength: number;
  totalAudioDuration: number;
}

export interface Session {
    id: string;
    name: string;
    type: 'AI vs AI' | 'Live Training';
    savedAt: string;
    messages: Message[];
    stats?: Stats;
    analysis?: AnalyzePerformanceOutput | null;
    transcript: string;
}
