"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, login, isLoading } = useFrappeAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ username: email, password });
      toast.success("Logged in");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Invalid credentials";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FadeIn y={16} className="w-full max-w-sm">
        <Card>
        <CardHeader>
          <CardTitle className="text-xl">Log in</CardTitle>
          <CardDescription>
            Use your Frappe site credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting || isLoading}>
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  );
}
