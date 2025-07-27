"use client";

import { useState } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { Statistics } from "@/components/dashboard/Statistics";
import { customizeRoleplay } from "@/ai/flows/customize-roleplay-configuration";
import { generateVoiceModulation } from "@/ai/flows/generate-voice-modulation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Message {
  id: string;
  speaker: "salesperson_agent" | "consumer_agent";
  text: string;
  isGeneratingAudio: boolean;
  audioData?: string;
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

  const processAndAddMessage = async (
    speaker: "salesperson_agent" | "consumer_agent",
    rawText: string
  ) => {
    const messageId = `${speaker}-${Date.now()}`;
    
    // Initial message state
    const initialMessage: Message = {
      id: messageId,
      speaker,
      text: rawText.replace(tonePattern, "").trim(),
      isGeneratingAudio: true,
    };
    setMessages(prev => [...prev, initialMessage]);

    // Extract tone and clean text for TTS
    const toneMatch = rawText.match(tonePattern);
    const tone = toneMatch ? toneMatch[1].toLowerCase().trim() : undefined;
    const cleanText = initialMessage.text;

    try {
      const audioResult = await generateVoiceModulation({
        text: cleanText,
        speaker,
        tone,
      });

      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioData: audioResult.media, isGeneratingAudio: false } : m));

      // Update stats with audio duration
      const audio = new Audio(audioResult.media);
      audio.onloadedmetadata = () => {
        setStats(prev => ({
          ...prev,
          totalAudioDuration: prev.totalAudioDuration + audio.duration,
        }));
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
  };
  
  const handleStartSimulation = async (values: ConfigurationFormValues) => {
    setIsLoading(true);
    setMessages([]);
    setStats({
      totalMessages: 0,
      meetingBooked: false,
      conversationLength: 0,
      totalAudioDuration: 0,
    });
    setStartTime(Date.now());

    try {
      const result = await customizeRoleplay(values);

      if (result.salesAgentResponse) {
        await processAndAddMessage("salesperson_agent", result.salesAgentResponse);
      }
      if (result.consumerAgentResponse) {
        await processAndAddMessage("consumer_agent", result.consumerAgentResponse);
      }
      
      const meetingBooked = result.salesAgentResponse.includes("TERMINATE") || result.consumerAgentResponse.includes("TERMINATE");

      setStats(prev => ({
        ...prev,
        totalMessages: (result.salesAgentResponse ? 1 : 0) + (result.consumerAgentResponse ? 1 : 0),
        meetingBooked,
        conversationLength: (Date.now() - (startTime ?? Date.now())) / 1000,
      }));

    } catch (error) {
      console.error("Simulation failed:", error);
      toast({
        title: "Simulation Failed",
        description: "An error occurred while running the simulation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Roleplay Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigurationPanel onSubmit={handleStartSimulation} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      <div className="xl:col-span-2 space-y-6">
        <ConversationDisplay messages={messages} isLoading={isLoading} />
        <Statistics stats={stats} />
      </div>
    </div>
  );
}
