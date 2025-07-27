"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, User, Play, Pause, Loader2, Volume2, Mic } from "lucide-react";
import type { Message } from "@/app/dashboard/page";

interface ConversationDisplayProps {
  messages: Message[];
  isLoading: boolean;
}

export function ConversationDisplay({ messages, isLoading }: ConversationDisplayProps) {
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  const playAudio = (audioData: string, messageId: string) => {
    if (audioRef.current && activeAudio === messageId) {
      audioRef.current.pause();
      setActiveAudio(null);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(audioData);
    audioRef.current.play();
    setActiveAudio(messageId);
    audioRef.current.onended = () => {
      setActiveAudio(null);
    };
  };

  return (
    <Card className="h-full flex flex-col shadow-sm">
       <CardHeader>
        <CardTitle className="font-headline text-2xl">Simulation Transcript</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-[calc(60vh-theme(spacing.16))] p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-4",
                  message.speaker === "salesperson_agent" ? "justify-start" : "justify-end"
                )}
              >
                {message.speaker === "salesperson_agent" && (
                  <Avatar className="border">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-xl p-4 max-w-xl shadow-sm",
                    message.speaker === "salesperson_agent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border"
                  )}
                >
                  <p className="font-bold mb-2 flex items-center gap-2 text-sm">
                    {message.speaker === "salesperson_agent" ? <><Mic size={16}/> Sales Agent</> : <><User size={16}/> Consumer Agent</>}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  {message.audioData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 -ml-2"
                      onClick={() => playAudio(message.audioData!, message.id)}
                    >
                      {activeAudio === message.id ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      Play Audio
                    </Button>
                  )}
                   {message.isGeneratingAudio && (
                     <div className="flex items-center text-xs mt-2 opacity-80">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Generating audio...
                     </div>
                   )}
                </div>
                {message.speaker === "consumer_agent" && (
                   <Avatar className="border">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages.length > 0 && (
               <div className="flex items-start gap-4 justify-start">
                   <Avatar className="border">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                   <div className="rounded-xl p-4 max-w-lg shadow-sm bg-primary text-primary-foreground">
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                   </div>
               </div>
            )}
             {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[calc(60vh-theme(spacing.16))] text-center text-muted-foreground">
                  <Volume2 size={48} className="mb-4" />
                  <h3 className="text-lg font-semibold">Start a New Simulation</h3>
                  <p className="text-sm">Configure the prompts and click "Start Simulation" to begin.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
