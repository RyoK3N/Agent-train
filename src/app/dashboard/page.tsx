
"use client";

import { useState, useEffect, useRef } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { Statistics } from "@/components/dashboard/Statistics";
import { customizeRoleplay, CustomizeRoleplayInput } from "@/ai/flows/customize-roleplay-configuration";
import { generateVoiceModulation } from "@/ai/flows/generate-voice-modulation";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, BarChart3, Bot, User, Play, Pause, Loader2, Mic } from "lucide-react";


export interface Message {
  id: string;
  speaker: "salesperson_agent" | "consumer_agent";
  text: string;
  isGeneratingAudio: boolean;
  audioData?: string;
  tone?: string;
}

export interface Stats {
  totalMessages: number;
  meetingBooked: boolean;
  conversationLength: number;
  totalAudioDuration: number;
}

const tonePattern = /\*([^*]+)\*/;

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    meetingBooked: false,
    conversationLength: 0,
    totalAudioDuration: 0,
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const conversationHistory = useRef<string[]>([]);
  const simulationStopped = useRef(false);

  // Close sheet states
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        if (!simulationStopped.current) {
          setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const processAndAddMessage = async (speaker: "salesperson_agent" | "consumer_agent", rawText: string) => {
    const messageId = `${speaker}-${Date.now()}`;
    const toneMatch = rawText.match(tonePattern);
    const tone = toneMatch ? toneMatch[1].toLowerCase().trim() : undefined;
    const cleanText = rawText.replace(tonePattern, "").trim();

    const newMessage: Message = {
      id: messageId,
      speaker,
      text: cleanText,
      tone: tone,
      isGeneratingAudio: true,
    };
    setMessages(prev => [...prev, newMessage]);
    conversationHistory.current.push(`${speaker}: ${cleanText}`);

    try {
      const audioResult = await generateVoiceModulation({ text: cleanText, speaker, tone });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioData: audioResult.media, isGeneratingAudio: false } : m));

      const audio = new Audio(audioResult.media);
      audio.onloadedmetadata = () => {
        setStats(prev => ({ ...prev, totalAudioDuration: prev.totalAudioDuration + audio.duration }));
      };
    } catch (error) {
      console.error("Error generating voice:", error);
      toast({
        title: "Audio Generation Failed",
        description: `Could not generate audio for the ${speaker}.`,
        variant: "destructive",
      });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingAudio: false } : m));
    }

    return cleanText;
  };

  const runConversationTurn = async (values: ConfigurationFormValues, currentQuery: string) => {
    setIsContinuing(true);
    try {
      const result = await customizeRoleplay({ ...values, query: currentQuery });
      let salesResponseText = "";
      let consumerResponseText = "";

      if (result.salesAgentResponse) {
        salesResponseText = await processAndAddMessage("salesperson_agent", result.salesAgentResponse);
      }
      if (result.consumerAgentResponse) {
        consumerResponseText = await processAndAddMessage("consumer_agent", result.consumerAgentResponse);
      }

      const meetingBooked = salesResponseText.includes("TERMINATE") || consumerResponseText.includes("TERMINATE");

      setStats(prev => ({
        ...prev,
        totalMessages: conversationHistory.current.length,
        meetingBooked: prev.meetingBooked || meetingBooked,
      }));

      if (meetingBooked) {
        simulationStopped.current = true;
        setIsLoading(false);
        setIsContinuing(false);
        return;
      }

      // Continue the conversation
      const nextQuery = `Continue the conversation based on the last response. The conversation history is: \n${conversationHistory.current.join('\n')}\n\n The last response was from the consumer agent. Now it is the sales agent's turn.`;
      
      // Introduce a small delay to make the conversation feel more natural
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!simulationStopped.current) {
        await runConversationTurn(values, nextQuery);
      }

    } catch (error) {
      console.error("Simulation turn failed:", error);
      toast({
        title: "Simulation Turn Failed",
        description: "An error occurred during the conversation.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsContinuing(false);
      simulationStopped.current = true;
    }
  };

  const handleStartSimulation = async (values: ConfigurationFormValues) => {
    setIsConfigOpen(false);
    setIsLoading(true);
    simulationStopped.current = false;
    setMessages([]);
    conversationHistory.current = [];
    setStats({
      totalMessages: 0,
      meetingBooked: false,
      conversationLength: 0,
      totalAudioDuration: 0,
    });
    setStartTime(Date.now());

    await runConversationTurn(values, values.query);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <ConversationDisplay messages={messages} isLoading={isLoading || isContinuing} />
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md">
              <BarChart3 className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl">Performance Dashboard</SheetTitle>
            </SheetHeader>
            <div className="py-8">
              <Statistics stats={stats} />
            </div>
          </SheetContent>
        </Sheet>
        
        <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl">
             <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Roleplay Configuration</SheetTitle>
             </SheetHeader>
             <div className="py-4 h-full overflow-y-auto pr-6">
                <ConfigurationPanel onSubmit={handleStartSimulation} isLoading={isLoading} />
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
