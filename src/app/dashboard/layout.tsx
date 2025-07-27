import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { Bell, LifeBuoy, LogOut, Settings } from "lucide-react";
import Link from 'next/link';

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
            <h1 className="text-2xl font-bold font-headline">Vocalis AI</h1>
            <SidebarTrigger className="ml-auto"/>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-grow p-4">
          {/* Content inside sidebar, if any */}
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
        <header className="flex items-center p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <SidebarTrigger className="md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LifeBuoy className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
