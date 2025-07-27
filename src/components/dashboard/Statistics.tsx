"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, List, Hourglass } from "lucide-react";
import type { Stats } from "@/app/dashboard/page";

interface StatisticsProps {
  stats: Stats;
}

export function Statistics({ stats }: StatisticsProps) {
  return (
    <div>
       <h2 className="text-2xl font-bold font-headline mb-4">Performance Dashboard</h2>
       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">in current simulation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Booked</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.meetingBooked ? 'text-green-600' : 'text-red-600'}`}>
              {stats.meetingBooked ? "Yes" : "No"}
            </div>
            <p className="text-xs text-muted-foreground">Based on 'TERMINATE' keyword</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversation Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversationLength.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Total duration of exchange</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audio Duration</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAudioDuration.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Sum of all generated audio</p>
          </CardContent>
        </Card>
       </div>
    </div>
  );
}
