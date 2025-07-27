
"use client";

import { useState, useEffect, useRef } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { PerformanceReview } from "@/components/training/PerformanceReview";
import { customizeRoleplay } from "@/ai/flows/customize-roleplay-configuration";
import { generateVoiceModulation } from "@/ai/flows/generate-voice-modulation";
import { analyzePerformance, AnalyzePerformanceOutput } from "@/ai/flows/analyze-performance-flow";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Bot, User, Play, Pause, Loader2, Mic, Send, Redo } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface Message {
  id: string;
  speaker: "salesperson_agent" | "consumer_agent" | "user";
  text: string;
  isGeneratingAudio?: boolean;
  audioData?: string;
  tone?: string;
}

const tonePattern = /\*([^*]+)\*/;

export default function TrainingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSTTLoading, setIsSTTLoading] = useState(false);
  const { toast } = useToast();
  const conversationHistory = useRef<string[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<ConfigurationFormValues | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzePerformanceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");

  const processAndAddMessage = async (speaker: "consumer_agent" | "user", rawText: string, idPrefix: string, tone?: string) => {
    if (!rawText) return "";

    const messageId = `${idPrefix}-${Date.now()}`;
    const cleanText = rawText.replace(tonePattern, "").trim();

    const newMessage: Message = {
      id: messageId,
      speaker,
      text: cleanText,
      tone: tone,
      isGeneratingAudio: speaker === 'consumer_agent',
    };
    setMessages(prev => [...prev, newMessage]);
    conversationHistory.current.push(`${speaker === 'consumer_agent' ? 'Consumer AI' : 'Sales Agent (Human)'}: ${cleanText}`);

    if (speaker === "consumer_agent") {
      try {
        const audioResult = await generateVoiceModulation({ text: cleanText, speaker, tone });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioData: audioResult.media, isGeneratingAudio: false } : m));
      } catch (error) {
        console.error("Error generating voice:", error);
        toast({
          title: "Audio Generation Failed",
          description: "Could not generate audio for the AI response.",
          variant: "destructive",
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingAudio: false } : m));
      }
    }
    
    return cleanText;
  };
  
  const handleUserSubmit = async () => {
      if (!userTranscript.trim() || !currentConfig) return;

      setIsLoading(true);
      await processAndAddMessage("user", userTranscript, 'user');
      setUserTranscript("");

      try {
        const query = `The user (sales agent) said: "${userTranscript}". The conversation history is:\n${conversationHistory.current.join("\n")}\n\nIt is now the Consumer Agent's turn to respond.`;
        const result = await customizeRoleplay({ ...currentConfig, query });

        if (result.consumerAgentResponse) {
          const toneMatch = result.consumerAgentResponse.match(tonePattern);
          const tone = toneMatch ? toneMatch[1].toLowerCase().trim() : undefined;
          const consumerResponseText = await processAndAddMessage("consumer_agent", result.consumerAgentResponse, 'consumer', tone);
          
          if (consumerResponseText.includes("TERMINATE")) {
             endSession();
          }
        } else {
            // If consumer doesn't respond, maybe the conversation is over or stalled.
            toast({ title: "Conversation Update", description: "The consumer agent did not provide a response. You can end the session for analysis."})
        }
      } catch (error) {
         console.error("AI turn failed:", error);
         toast({ title: "AI Turn Failed", description: "The AI failed to generate a response.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  };

  const handleStartSession = (values: ConfigurationFormValues) => {
    setIsConfigOpen(false);
    setSessionActive(true);
    setCurrentConfig(values);
    setIsLoading(true);
    setMessages([]);
    conversationHistory.current = [];
    setAnalysis(null);

    // Initial message from AI to kick things off
    const startConversation = async () => {
        try {
            const result = await customizeRoleplay({ ...values, query: values.query });
            let initialText = result.consumerAgentResponse || result.salesAgentResponse; // Prefer consumer response to start
            if (initialText) {
                const toneMatch = initialText.match(tonePattern);
                const tone = toneMatch ? toneMatch[1].toLowerCase().trim() : undefined;
                await processAndAddMessage("consumer_agent", initialText, 'consumer', tone);
            } else {
                toast({ title: "Simulation Start Failed", description: "The AI could not generate an opening line.", variant: "destructive" });
                 setSessionActive(false);
            }
        } catch (error) {
            console.error("Simulation start failed:", error);
            toast({ title: "Simulation Start Failed", description: "Could not start the conversation.", variant: "destructive" });
            setSessionActive(false);
        } finally {
            setIsLoading(false);
        }
    };
    startConversation();
  };
  
  const endSession = async () => {
    if (!currentConfig || conversationHistory.current.length === 0) {
        toast({ title: "Analysis Skipped", description: "Cannot analyze an empty session.", variant: "destructive"});
        return;
    };
    setSessionActive(false);
    setIsAnalyzing(true);
    toast({ title: "Session Ended", description: "Analyzing your performance..." });
    try {
        const result = await analyzePerformance({
            transcript: conversationHistory.current.join('\n'),
            salesAgentPrompt: currentConfig.salesAgentPrompt,
        });
        setAnalysis(result);
    } catch(error) {
        console.error("Analysis failed", error);
        toast({ title: "Analysis Failed", description: "Could not analyze the session.", variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleReset = () => {
    setMessages([]);
    conversationHistory.current = [];
    setSessionActive(false);
    setIsLoading(false);
    setAnalysis(null);
    setCurrentConfig(null);
    setIsConfigOpen(true);
    setUserTranscript("");
  }

  return (
    <div className="h-screen flex flex-col relative">
       <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button variant="outline" size="icon" className="shadow-md rounded-full" onClick={handleReset}>
            <Redo className="h-5 w-5" />
            <span className="sr-only">Reset Session</span>
        </Button>
        <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md rounded-full" disabled={sessionActive}>
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl">
             <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Training Configuration</SheetTitle>
             </SheetHeader>
             <div className="py-4 h-[calc(100vh-80px)] overflow-y-auto pr-6">
                <ConfigurationPanel onSubmit={handleStartSession} isLoading={isLoading} />
             </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <ConversationDisplay messages={messages} isLoading={isLoading && messages.length > 0} />
        {analysis && (
            <div className="w-full max-w-4xl mt-4">
                <PerformanceReview analysis={analysis} isLoading={isAnalyzing}/>
            </div>
        )}
      </div>
      
       <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md p-4 border-t">
          <div className="w-full max-w-4xl mx-auto">
            {sessionActive ? (
                <div className="flex items-end gap-2">
                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-full shadow-lg flex-shrink-0" disabled={isSTTLoading}>
                        <Mic className="h-7 w-7"/>
                    </Button>
                     <Textarea
                        value={userTranscript}
                        onChange={(e) => setUserTranscript(e.target.value)}
                        placeholder="For now, type your response here... (Speech-to-text coming soon!)"
                        className="text-lg min-h-[56px] max-h-48 resize-y"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleUserSubmit();
                            }
                        }}
                    />
                    <Button onClick={handleUserSubmit} size="icon" className="h-14 w-14 rounded-full shadow-lg flex-shrink-0" disabled={isLoading || !userTranscript.trim()}>
                       {isLoading ? <Loader2 className="animate-spin h-7 w-7"/> : <Send className="h-7 w-7"/>}
                    </Button>
                    <Button variant="destructive" className="h-14 rounded-full shadow-lg" onClick={endSession}>
                        <Pause className="mr-2 h-5 w-5"/> End Session
                    </Button>
                </div>
            ) : (
                 <div className="text-center text-muted-foreground">
                    { isAnalyzing ? "Analyzing performance..." : "Session not active. Configure and start a new session to begin."}
                 </div>
            )}
          </div>
       </div>
    </div>
  );
}
