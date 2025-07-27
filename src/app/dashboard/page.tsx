
"use client";

import { useState, useEffect, useRef } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { Statistics } from "@/components/dashboard/Statistics";
import { customizeRoleplay } from "@/ai/flows/customize-roleplay-configuration";
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

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !simulationStopped.current) {
      interval = setInterval(() => {
        setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const processAndAddMessage = async (speaker: "salesperson_agent" | "consumer_agent", rawText: string) => {
    if (!rawText) return "";
    
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
    conversationHistory.current.push(`${speaker === 'salesperson_agent' ? 'Sales Agent' : 'Consumer Agent'}: ${cleanText}`);

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
    if (simulationStopped.current) {
      setIsLoading(false);
      setIsContinuing(false);
      return;
    }

    setIsContinuing(true);
    
    try {
      const result = await customizeRoleplay({ ...values, query: currentQuery });
      let nextTurnSpeaker: "salesperson_agent" | "consumer_agent" | null = null;

      let salesResponseText = "";
      if (result.salesAgentResponse) {
        salesResponseText = await processAndAddMessage("salesperson_agent", result.salesAgentResponse);
        nextTurnSpeaker = "consumer_agent";
      }
      
      let consumerResponseText = "";
      if (result.consumerAgentResponse) {
        consumerResponseText = await processAndAddMessage("consumer_agent", result.consumerAgentResponse);
        nextTurnSpeaker = "salesperson_agent";
      }

      const meetingBooked = salesResponseText.includes("TERMINATE") || consumerResponseText.includes("TERMINATE");

      setStats(prev => ({
        ...prev,
        totalMessages: conversationHistory.current.length,
        meetingBooked: prev.meetingBooked || meetingBooked,
      }));

      if (meetingBooked) {
        simulationStopped.current = true;
        if(startTime) {
           setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
        }
        setIsLoading(false);
        setIsContinuing(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!simulationStopped.current && nextTurnSpeaker) {
         const nextQuery = `Continue the conversation. The history is:\n${conversationHistory.current.join("\n")}\n\nIt is now the ${nextTurnSpeaker === 'salesperson_agent' ? 'Sales Agent' : 'Consumer Agent'}'s turn.`;
         await runConversationTurn(values, nextQuery);
      } else {
        setIsLoading(false);
        setIsContinuing(false);
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
  
  const handleStopSimulation = () => {
    simulationStopped.current = true;
    if(startTime) {
       setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
    }
    setIsLoading(false);
    setIsContinuing(false);
  }

  return (
    <div className="h-screen flex flex-col relative">
       <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md rounded-full">
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
            <Button variant="outline" size="icon" className="shadow-md rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl">
             <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Roleplay Configuration</SheetTitle>
             </SheetHeader>
             <div className="py-4 h-[calc(100vh-80px)] overflow-y-auto pr-6">
                <ConfigurationPanel onSubmit={handleStartSimulation} isLoading={isLoading || isContinuing} />
             </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <ConversationDisplay messages={messages} isLoading={isLoading || isContinuing} />
      </div>
       {(isLoading || isContinuing) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button variant="destructive" onClick={handleStopSimulation} className="rounded-full shadow-lg">
                <Pause className="mr-2 h-4 w-4"/>
                Stop Simulation
            </Button>
        </div>
      )}
    </div>
  );
}
