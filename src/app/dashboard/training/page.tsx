
"use client";

import { useState, useEffect, useRef } from "react";
import { ConfigurationPanel, type ConfigurationFormValues } from "@/components/dashboard/ConfigurationPanel";
import { ConversationDisplay } from "@/components/dashboard/ConversationDisplay";
import { PerformanceReview } from "@/components/training/PerformanceReview";
import { SaveSessionDialog } from "@/components/dashboard/SaveSessionDialog";
import { customizeRoleplay } from "@/ai/flows/customize-roleplay-configuration";
import { generateVoiceModulation } from "@/ai/flows/generate-voice-modulation";
import { analyzePerformance, AnalyzePerformanceOutput } from "@/ai/flows/analyze-performance-flow";
import { speechToText } from "@/ai/flows/speech-to-text-flow";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Bot, User, Play, Pause, Loader2, Mic, Send, Redo, CircleStop } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore, Session } from "@/hooks/use-session-store";

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

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const addSession = useSessionStore(state => state.addSession);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);


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

  const handleUserSubmit = async (text: string) => {
      if (!text.trim() || !currentConfig) return;

      setIsLoading(true);
      await processAndAddMessage("user", text, 'user');
      setUserTranscript("");

      try {
        const query = `The user (sales agent) said: "${text}". The conversation history is:\n${conversationHistory.current.join("\n")}\n\nIt is now the Consumer Agent's turn to respond.`;
        const result = await customizeRoleplay({ ...currentConfig, query });

        if (result.consumerAgentResponse) {
          const toneMatch = result.consumerAgentResponse.match(tonePattern);
          const tone = toneMatch ? toneMatch[1].toLowerCase().trim() : undefined;
          const consumerResponseText = await processAndAddMessage("consumer_agent", result.consumerAgentResponse, 'consumer', tone);
          
          if (consumerResponseText.includes("TERMINATE")) {
             endSession();
          }
        } else {
            toast({ title: "Conversation Update", description: "The consumer agent did not provide a response. You can end the session for analysis."})
        }
      } catch (error) {
         console.error("AI turn failed:", error);
         toast({ title: "AI Turn Failed", description: "The AI failed to generate a response.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setIsSTTLoading(true);
          try {
            const result = await speechToText({ audioDataUri: base64data });
            if (result.transcript) {
              handleUserSubmit(result.transcript);
            } else {
              toast({ title: "Transcription Failed", description: "Could not convert audio to text. Please try again or type your response.", variant: "destructive"});
            }
          } catch(e) {
             toast({ title: "Transcription Error", description: "Something went wrong during transcription.", variant: "destructive"});
          } finally {
            setIsSTTLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone permissions in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  const handleStartSession = (values: ConfigurationFormValues) => {
    setIsConfigOpen(false);
    setSessionActive(true);
    setCurrentConfig(values);
    setIsLoading(false); 
    setMessages([]);
    conversationHistory.current = [];
    setAnalysis(null);
    const firstMessage = {
        id: 'initial-instruction',
        speaker: 'consumer_agent' as const,
        text: "I'm ready when you are. You can start the conversation by typing or using the microphone.",
        isGeneratingAudio: false
    };
    setMessages([firstMessage]);
  };
  
  const endSession = async () => {
    if (!currentConfig || conversationHistory.current.length <= 1) { // 1 because of the initial message
        toast({ title: "Analysis Skipped", description: "Cannot analyze an empty or very short session.", variant: "destructive"});
        setSessionActive(false);
        setIsSaveDialogOpen(false);
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
        setIsSaveDialogOpen(true);
    } catch(error) {
        console.error("Analysis failed", error);
        toast({ title: "Analysis Failed", description: "Could not analyze the session.", variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleSaveSession = (sessionName: string) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: sessionName,
      messages,
      analysis,
      transcript: conversationHistory.current.join('\n'),
      savedAt: new Date().toISOString(),
      type: "Live Training"
    };
    addSession(newSession);
    toast({ title: "Session Saved", description: `Session "${sessionName}" has been saved.`});
    setIsSaveDialogOpen(false);
  }

  const handleReset = () => {
    setMessages([]);
    conversationHistory.current = [];
    setSessionActive(false);
    setIsLoading(false);
    setIsSTTLoading(false);
    setIsRecording(false);
    if(mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    setAnalysis(null);
    setCurrentConfig(null);
    setIsConfigOpen(true);
    setUserTranscript("");
    setIsSaveDialogOpen(false);
  }

  const isInputDisabled = isLoading || isSTTLoading || isRecording || !sessionActive;

  return (
    <>
    <SaveSessionDialog 
      open={isSaveDialogOpen}
      onOpenChange={setIsSaveDialogOpen}
      onSave={handleSaveSession}
      onCancel={() => setIsSaveDialogOpen(false) /* just close dialog, don't reset */}
      defaultName={`Live Training Session - ${new Date().toLocaleString()}`}
    />
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
                <ConfigurationPanel 
                    onSubmit={handleStartSession} 
                    isLoading={isLoading || isSTTLoading} 
                    initialQuery="The sales agent (human) will start the conversation. The AI consumer should wait for the user's first message and then respond."
                />
             </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4 overflow-y-auto">
        <ConversationDisplay messages={messages} isLoading={(isLoading || isSTTLoading) && messages.length > 0} />
        {analysis && (
            <div className="w-full max-w-4xl mt-4 mb-32">
                <PerformanceReview analysis={analysis} isLoading={isAnalyzing}/>
            </div>
        )}
      </div>
      
       <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md p-4 border-t">
          <div className="w-full max-w-4xl mx-auto">
            {sessionActive ? (
                <div className="flex items-end gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      className="h-14 w-14 rounded-full shadow-lg flex-shrink-0"
                      onClick={handleToggleRecording}
                      disabled={isInputDisabled}
                    >
                        {isSTTLoading ? (
                            <Loader2 className="animate-spin h-7 w-7" />
                        ) : isRecording ? (
                            <CircleStop className="h-7 w-7" />
                        ) : (
                            <Mic className="h-7 w-7" />
                        )}
                        <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </Button>
                     <Textarea
                        value={userTranscript}
                        onChange={(e) => setUserTranscript(e.target.value)}
                        placeholder={isRecording ? "Recording... speak now!" : "Type your response or use the mic..."}
                        className="text-lg min-h-[56px] max-h-48 resize-y"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleUserSubmit(userTranscript);
                            }
                        }}
                        disabled={isInputDisabled}
                    />
                    <Button onClick={() => handleUserSubmit(userTranscript)} size="icon" className="h-14 w-14 rounded-full shadow-lg flex-shrink-0" disabled={isInputDisabled || !userTranscript.trim()}>
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
    </>
  );
}
