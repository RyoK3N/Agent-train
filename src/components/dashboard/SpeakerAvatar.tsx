
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Mic } from "lucide-react";
import type { Message } from "@/types";

export const SpeakerAvatar = ({ speaker }: { speaker: Message["speaker"] }) => {
    if (speaker === "consumer_agent") {
        return (
            <Avatar className="border-2 border-secondary shadow-lg">
                <AvatarFallback><User size={20} /></AvatarFallback>
            </Avatar>
        );
    }

    if (speaker === 'user') {
         return (
             <Avatar className="border-2 border-blue-500 shadow-lg">
                <AvatarFallback className="bg-blue-500 text-white"><Mic size={20} /></AvatarFallback>
            </Avatar>
        )
    }

    // salesperson_agent
    return (
        <Avatar className="border-2 border-cyan-500/50 shadow-lg">
            <AvatarFallback className="bg-secondary/50 text-cyan-400"><Bot size={20} /></AvatarFallback>
        </Avatar>
    );
};
