
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, User, Play, Pause, Loader2, Mic, Settings } from "lucide-react";
import type { Message } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { SpeakerAvatar } from './SpeakerAvatar';
import { SpeakerName } from './SpeakerName';
import { Button } from "@/components/ui/button";
interface ConversationDisplayProps {
  messages: Message[];
  isLoading: boolean;
}

export function ConversationDisplay({ messages, isLoading }: ConversationDisplayProps) {
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      setTimeout(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }, 100);
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

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const isHumanMessage = (speaker: Message['speaker']) => speaker === 'user';

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
        <ScrollArea className="flex-grow w-full p-4" viewportRef={viewportRef}>
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={cn(
                  "flex items-start gap-4 my-6",
                   isHumanMessage(message.speaker) ? "justify-end" : "justify-start"
                )}
              >
                {!isHumanMessage(message.speaker) && <SpeakerAvatar speaker={message.speaker} />}
                <div
                  className={cn(
                    "rounded-xl p-4 max-w-xl shadow-lg transition-all duration-300",
                    message.speaker === "salesperson_agent"
                      ? "bg-secondary text-secondary-foreground rounded-br-none"
                      : isHumanMessage(message.speaker)
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-primary-foreground rounded-bl-none"
                      : "bg-card text-card-foreground border rounded-bl-none"
                  )}
                >
                  <p className="font-bold mb-2 flex items-center gap-2 text-sm">
                    <SpeakerName speaker={message.speaker} />
                    {message.tone && <span className="text-xs font-normal opacity-80 bg-black/20 px-2 py-0.5 rounded-full capitalize">{message.tone}</span>}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  {message.audioData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 -ml-2 hover:bg-white/20 text-white/80 hover:text-white"
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
                 {isHumanMessage(message.speaker) && <SpeakerAvatar speaker={message.speaker} />}
              </motion.div>
            ))}

            {isLoading && messages.length > 1 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 my-6 justify-start"
              >
                 <SpeakerAvatar speaker="consumer_agent" />
                 <div className="rounded-xl p-4 max-w-lg shadow-lg bg-card text-card-foreground border">
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                 </div>
              </motion.div>
            )}
             </AnimatePresence>
        </ScrollArea>
        {messages.length === 0 && !isLoading && (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <div className="p-8 bg-secondary/50 rounded-full border-2 border-primary/20 shadow-lg mb-6 shadow-primary/10">
                        <Bot size={64} className="text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold font-headline mb-2 text-primary-foreground">Vocalis AI Simulation</h3>
                  <p className="text-md max-w-md">
                      Welcome! Click the <Settings size={16} className="inline-block mx-1" /> icon to configure your agents and start a new session.
                  </p>
              </div>
        )}
    </div>
  );
}
