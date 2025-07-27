
"use client";

import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { LogOut, MessageSquare, History, MicVocal, Search } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/hooks/use-session-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sessions = useSessionStore((state) => state.sessions);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return (
    <SidebarProvider>
      <div className="md:flex">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold font-headline">Vocalis AI</h1>
              <SidebarTrigger className="ml-auto hidden md:flex"/>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                        <Link href="/dashboard">
                          <MessageSquare />
                          AI vs AI Sim
                        </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/dashboard/training'}>
                        <Link href="/dashboard/training">
                          <MicVocal />
                          Live Training
                        </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="flex items-center gap-2">
                  <History />
                  Recent Sessions
                </SidebarGroupLabel>
                 <div className="px-2 pb-2">
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search sessions..."
                        className="w-full rounded-lg bg-background pl-8 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                 </div>
                {filteredSessions.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredSessions.map(session => (
                       <Button 
                          key={session.id} 
                          variant="ghost" 
                          asChild
                          className="w-full justify-start text-sm truncate h-8"
                       >
                         <Link href={`/dashboard/session/${session.id}`}>
                           {session.name}
                         </Link>
                       </Button>
                    ))}
                  </div>
                ) : (
                   <div className="p-4 text-sm text-center text-muted-foreground">
                    No sessions found. <br/>End a session to save it here.
                  </div>
                )}
              </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://placehold.co/100x100" alt="User Avatar" data-ai-hint="person portrait" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">User</span>
                  <span className="text-muted-foreground">user@example.com</span>
                </div>
                <Button asChild variant="ghost" size="icon" className="ml-auto">
                  <Link href="/login">
                    <LogOut className="h-5 w-5"/>
                  </Link>
                </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col w-full">
            <header className="md:hidden p-4 border-b flex justify-end">
                <SidebarTrigger/>
            </header>
            <SidebarInset>
              <main>
                  {children}
              </main>
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
