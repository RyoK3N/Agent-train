
"use client";

import { useState, useEffect, useRef } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { Statistics } from "@/components/dashboard/Statistics";
import { SaveSessionDialog } from "@/components/dashboard/SaveSessionDialog";
import { customizeRoleplay } from "@/ai/flows/customize-roleplay-configuration";
import { generateVoiceModulation } from "@/ai/flows/generate-voice-modulation";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, BarChart3, Bot, User, Play, Pause, Loader2, Mic, Redo } from "lucide-react";
import { useSessionStore, Session } from "@/hooks/use-session-store";

export interface Message {
  id: string;
  speaker: "salesperson_agent" | "consumer_agent" | "user";
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
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    meetingBooked: false,
    conversationLength: 0,
    totalAudioDuration: 0,
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const conversationHistory = useRef<string[]>([]);
  const simulationStopped = useRef(true);
  const addSession = useSessionStore(state => state.addSession);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !simulationStopped.current) {
      interval = setInterval(() => {
        setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, simulationStopped.current]);

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
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await customizeRoleplay({ ...values, query: currentQuery });
      let nextTurnSpeaker: "salesperson_agent" | "consumer_agent" | null = null;
      let responseGenerated = false;

      let salesResponseText = "";
      if (result.salesAgentResponse) {
        salesResponseText = await processAndAddMessage("salesperson_agent", result.salesAgentResponse);
        nextTurnSpeaker = "consumer_agent";
        responseGenerated = true;
      }
      
      let consumerResponseText = "";
      if (result.consumerAgentResponse) {
        consumerResponseText = await processAndAddMessage("consumer_agent", result.consumerAgentResponse);
        nextTurnSpeaker = "salesperson_agent";
        responseGenerated = true;
      }

      if (!responseGenerated) {
        toast({ title: "Simulation Stall", description: "The AI did not produce a response for either agent.", variant: "destructive"});
        handleStopSimulation();
        return;
      }

      const meetingBooked = salesResponseText.includes("TERMINATE") || consumerResponseText.includes("TERMINATE");

      setStats(prev => ({
        ...prev,
        totalMessages: conversationHistory.current.length,
        meetingBooked: prev.meetingBooked || meetingBooked,
      }));

      if (meetingBooked) {
        toast({title: "Simulation Complete", description: "The conversation has reached its conclusion."})
        handleStopSimulation();
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!simulationStopped.current && nextTurnSpeaker) {
         const nextQuery = `Continue the conversation. The history is:\n${conversationHistory.current.join("\n")}\n\nIt is now the ${nextTurnSpeaker === 'salesperson_agent' ? 'Sales Agent' : 'Consumer Agent'}'s turn.`;
         await runConversationTurn(values, nextQuery);
      } else {
        setIsLoading(false);
      }

    } catch (error) {
      console.error("Simulation turn failed:", error);
      toast({
        title: "Simulation Turn Failed",
        description: "An error occurred during the conversation.",
        variant: "destructive",
      });
      handleStopSimulation();
    }
  };

  const handleStartSimulation = (values: ConfigurationFormValues) => {
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

    runConversationTurn(values, values.query);
  };
  
  const handleStopSimulation = () => {
    simulationStopped.current = true;
    if(startTime) {
       setStats(prev => ({ ...prev, conversationLength: (Date.now() - startTime) / 1000 }));
       setStartTime(null);
    }
    setIsLoading(false);
    if(messages.length > 0) {
      setIsSaveDialogOpen(true);
    }
  }

  const handleSaveSession = (sessionName: string) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: sessionName,
      messages,
      stats,
      transcript: conversationHistory.current.join('\n'),
      savedAt: new Date().toISOString(),
      type: "AI vs AI"
    };
    addSession(newSession);
    toast({ title: "Session Saved", description: `Session "${sessionName}" has been saved.`});
    setIsSaveDialogOpen(false);
  }
  
  const handleReset = () => {
    handleStopSimulation();
    setMessages([]);
    conversationHistory.current = [];
    setStats({ totalMessages: 0, meetingBooked: false, conversationLength: 0, totalAudioDuration: 0 });
    setIsConfigOpen(true);
    setIsSaveDialogOpen(false);
  }


  return (
    <>
      <SaveSessionDialog 
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveSession}
        onCancel={handleReset}
        defaultName={`AI vs AI Session - ${new Date().toLocaleString()}`}
      />
      <div className="h-screen flex flex-col relative">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button variant="outline" size="icon" className="shadow-md rounded-full" onClick={handleReset}>
              <Redo className="h-5 w-5" />
              <span className="sr-only">Reset Simulation</span>
          </Button>
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
                  <ConfigurationPanel 
                      onSubmit={handleStartSimulation} 
                      isLoading={isLoading} 
                      initialQuery="The sales agent AI should start the conversation. The consumer AI should wait for the sales agent's first message and then respond."
                  />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-grow flex items-center justify-center p-4">
          <ConversationDisplay messages={messages} isLoading={isLoading && messages.length > 0} />
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              { isLoading && (
                  <Button variant="destructive" onClick={handleStopSimulation} className="rounded-full shadow-lg">
                      <Pause className="mr-2 h-4 w-4"/>
                      Stop Simulation
                  </Button>
              )}
              { !isLoading && !simulationStopped.current && !isConfigOpen && messages.length > 0 && (
                  <Button variant="secondary" onClick={handleStopSimulation} className="rounded-full shadow-lg">
                      <Pause className="mr-2 h-4 w-4"/>
                      Pause Simulation
                  </Button>
              )}
        </div>
      </div>
    </>
  );
}
