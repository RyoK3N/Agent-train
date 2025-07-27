
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Logo } from "@/components/icons/Logo";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-sm shadow-2xl bg-secondary/50 border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 150 }}
              className="inline-flex items-center justify-center mb-4"
            >
              <Logo className="w-16 h-16 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold font-headline text-primary-foreground">Vocalis AI</h1>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              The future of sales training is here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mt-4">
              <Button onClick={handleLogin} className="w-full text-lg" size="lg">
                <GoogleIcon className="mr-3 h-6 w-6" />
                Sign in with Google
              </Button>
              <p className="px-8 pt-2 text-center text-xs text-muted-foreground/80">
                By continuing, you agree to our{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Terms
                </a>{" "}
                &{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
