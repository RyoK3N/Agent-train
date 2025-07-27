
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/hooks/use-session-store';
import { ConversationDisplay } from '@/components/dashboard/ConversationDisplay';
import { Statistics } from '@/components/dashboard/Statistics';
import { PerformanceReview } from '@/components/training/PerformanceReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bot, Mic, Calendar, BrainCircuit, BarChart3, Trash2, Edit, Check, X } from 'lucide-react';
import type { Session } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { getSession, deleteSession, updateSessionName } = useSessionStore();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const foundSession = getSession(id);
      setSession(foundSession);
      if (foundSession) {
        setNewName(foundSession.name);
      }
    }
  }, [id, getSession]);

  const handleDelete = () => {
    if (id) {
        deleteSession(id);
        toast({ title: "Session Deleted", description: "The session has been permanently removed." });
        router.push('/dashboard');
    }
  }
  
  const handleNameUpdate = () => {
    if(id && newName.trim()) {
      updateSessionName(id, newName.trim());
      setIsEditing(false);
      toast({ title: "Session Renamed", description: `The session has been renamed to "${newName.trim()}".` });
    }
  }
  
  if (session === undefined) {
    return (
        <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="pt-8">
               <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }

  if (session === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">Session Not Found</CardTitle>
                <CardDescription>The session you are looking for does not exist or has been deleted.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
                {!isEditing ? (
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                      {session.name}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4"/>
                      </Button>
                    </h1>
                ) : (
                    <div className="flex items-center gap-2">
                        <Input value={newName} onChange={e => setNewName(e.target.value)} className="text-3xl font-bold font-headline h-12"/>
                        <Button size="icon" onClick={handleNameUpdate}><Check className="h-5 w-5"/></Button>
                        <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}><X className="h-5 w-5"/></Button>
                    </div>
                )}
              
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                 <div className="flex items-center gap-1.5">
                    {session.type === 'AI vs AI' ? <Bot className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                    <span>{session.type} Session</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4"/>
                    <span>Saved on {new Date(session.savedAt).toLocaleDateString()}</span>
                 </div>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this session data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
             <Card className="h-[70vh]">
                 <ConversationDisplay messages={session.messages} isLoading={false} />
             </Card>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            {session.type === 'Live Training' && session.analysis && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <BrainCircuit className="h-5 w-5 text-primary"/>
                        Performance Review
                    </CardTitle>
                </CardHeader>
                <CardContent>
                   <PerformanceReview analysis={session.analysis} isLoading={false}/>
                </CardContent>
              </Card>
            )}
            {session.type === 'AI vs AI' && session.stats && (
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-lg">
                       <BarChart3 className="h-5 w-5 text-primary"/>
                        Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Statistics stats={session.stats} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
