
import { Bot, User, Mic } from "lucide-react";
import type { Message } from "@/types";

export const SpeakerName = ({ speaker }: { speaker: Message["speaker"] }) => {
     if (speaker === "consumer_agent") return <><User size={16}/> Consumer AI</>;
     if (speaker === 'user') return <><Mic size={16}/> You (Sales Agent)</>
     return <><Bot size={16}/> Sales AI</>;
}
