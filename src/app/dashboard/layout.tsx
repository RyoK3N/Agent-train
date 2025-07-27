
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
import { LogOut, MessageSquare, History } from "lucide-react";
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold font-headline">Vocalis AI</h1>
            <SidebarTrigger className="ml-auto"/>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard" isActive>
                        <MessageSquare />
                        New Simulation
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="flex items-center gap-2">
                <History />
                Recent Sessions
              </SidebarGroupLabel>
              <div className="p-2 text-sm text-muted-foreground">
                Session history will appear here.
              </div>
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
                <span className="text-sm text-muted-foreground">user@example.com</span>
              </div>
              <Link href="/login" className="ml-auto">
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5"/>
                </Button>
              </Link>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
