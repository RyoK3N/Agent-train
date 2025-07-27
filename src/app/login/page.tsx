"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Logo } from "@/components/icons/Logo";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, this would trigger the Google OAuth flow.
    // For this simulation, we'll just navigate to the dashboard.
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center justify-center w-full max-w-sm">
        <Card className="w-full shadow-lg border-border">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <Logo className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold font-headline">Vocalis AI</h1>
            </div>
            <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your AI-powered sales simulations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button onClick={handleLogin} className="w-full" size="lg">
                <GoogleIcon className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
              <p className="px-8 text-center text-xs text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
