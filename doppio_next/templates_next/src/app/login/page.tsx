"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFrappeAuth, useFrappePostCall } from "frappe-react-sdk";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion";
import { SiteFooter } from "@/components/site-header";
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
import { useWebsiteSettings } from "@/lib/website-settings";

function SignupForm({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Frappe's public signup endpoint (also enforces disable_signup server-side)
  const { call: signUp } = useFrappePostCall(
    "frappe.core.doctype.user.user.sign_up"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await signUp({
        email,
        full_name: fullName,
        redirect_to: "/",
      });
      // message is [code, human message]; code 0 = already registered
      const [, text] = (res?.message as [number, string]) ?? [];
      toast.success(text || "Registration request sent. Check your email.");
      onDone();
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Sign up failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, login, isLoading } = useFrappeAuth();
  const ws = useWebsiteSettings();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // /login#signup deep link (e.g. from the navbar Sign up button)
  useEffect(() => {
    if (window.location.hash === "#signup") {
      setMode("signup");
    }
  }, []);

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

  const signupAllowed = !!ws && !ws.disable_signup;
  const logo = ws?.app_logo || ws?.banner_image;
  const showSignup = mode === "signup" && signupAllowed;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-6">
        <FadeIn y={16} className="w-full max-w-sm">
          {logo ? (
            <div className="mb-6 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={ws?.app_name || "__SPA__"}
                className="h-12"
              />
            </div>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {showSignup ? "Sign up" : "Log in"}
              </CardTitle>
              <CardDescription>
                {showSignup
                  ? "Create an account on this site."
                  : "Use your Frappe site credentials to continue."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showSignup ? (
                <SignupForm onDone={() => setMode("login")} />
              ) : (
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
              )}
              {signupAllowed ? (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {showSignup ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="font-medium text-foreground hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      No account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="font-medium text-foreground hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground hover:underline">
              ← Back to home
            </Link>
          </p>
        </FadeIn>
      </main>
      {ws?.show_footer_on_login ? <SiteFooter /> : null}
    </div>
  );
}
