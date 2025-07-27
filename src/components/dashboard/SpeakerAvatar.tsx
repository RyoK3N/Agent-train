
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Mic } from "lucide-react";
import type { Message } from "@/types";

export const SpeakerAvatar = ({ speaker }: { speaker: Message["speaker"] }) => {
    if (speaker === "consumer_agent") {
        return (
            <Avatar className="border-2 shadow-lg">
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
        <Avatar className="border-2 border-primary shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
        </Avatar>
    );
};
