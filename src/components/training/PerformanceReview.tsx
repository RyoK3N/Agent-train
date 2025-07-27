
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import type { AnalyzePerformanceOutput } from "@/ai/flows/analyze-performance-flow";
import { Award, Target, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface PerformanceReviewProps {
  analysis: AnalyzePerformanceOutput | null;
  isLoading: boolean;
}

export function PerformanceReview({ analysis, isLoading }: PerformanceReviewProps) {
    if (isLoading) {
        return (
            <Card className="shadow-lg border-border animate-pulse">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Loader2 className="animate-spin"/> Analyzing Performance...
                    </CardTitle>
                    <CardDescription>Please wait while the AI coach reviews your conversation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-8 bg-muted rounded-md w-1/4"></div>
                    <div className="h-4 bg-muted rounded-md w-full"></div>
                    <div className="h-20 bg-muted rounded-md w-full"></div>
                </CardContent>
            </Card>
        )
    }

    if (!analysis) return null;

  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Award className="text-primary"/> Performance Review
        </CardTitle>
        <CardDescription>
          Here's a detailed breakdown of your sales call performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Overall Score</h3>
            <span
              className={cn(
                "text-2xl font-bold",
                analysis.overallScore > 75 ? "text-green-500" :
                analysis.overallScore > 50 ? "text-yellow-500" : "text-red-500"
              )}
            >
              {analysis.overallScore}/100
            </span>
          </div>
          <Progress value={analysis.overallScore} className="h-3" />
        </div>

        <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                        <Target /> Detailed Feedback
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown>{analysis.feedback}</ReactMarkdown>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp /> Strengths
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                    </ul>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold">
                     <div className="flex items-center gap-2 text-amber-600">
                        <TrendingDown /> Areas for Improvement
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                     <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        {analysis.areasForImprovement.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
