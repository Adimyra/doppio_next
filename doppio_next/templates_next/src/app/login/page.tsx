"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFrappeAuth, useFrappePostCall } from "frappe-react-sdk";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Gauge,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion";
import { SiteFooter } from "@/components/site-header";
import { ModeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { brandImage, useWebsiteSettings } from "@/lib/website-settings";

const PERKS = [
  { icon: ShieldCheck, label: "Secure & Reliable" },
  { icon: Gauge, label: "Lightning Fast Experience" },
  { icon: Sparkles, label: "Realtime ERP Data" },
];

const DIAL_CODES = ["+91", "+1", "+44", "+61", "+65", "+971"];

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="px-9"
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useFrappeAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ username: email, password });
      toast.success("Logged in");
      router.replace("/my-account");
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
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {/* Frappe's own reset flow, outside the SPA basePath */}
          <a
            href="/login#forgot"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" size="lg" disabled={submitting || isLoading}>
        {submitting ? "Logging in..." : "Login"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: signUp } = useFrappePostCall("__APP__.website_api.sign_up");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await signUp({
        email,
        full_name: `${firstName} ${lastName}`.trim(),
        mobile_no: phone ? `${dialCode}${phone.replace(/\s/g, "")}` : "",
        redirect_to: "/",
      });
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="signup-first">First name</Label>
          <div className="relative">
            <UserRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-first"
              autoComplete="given-name"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-last">Last name</Label>
          <Input
            id="signup-last"
            autoComplete="family-name"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-phone">Phone</Label>
        <div className="flex gap-2">
          <select
            aria-label="Country code"
            value={dialCode}
            onChange={(e) => setDialCode(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {DIAL_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <Input
            id="signup-phone"
            type="tel"
            autoComplete="tel-national"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="flex-1"
          />
        </div>
      </div>
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Creating account..." : "Create Account"}
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll email you a link to verify your account and set a password.
      </p>
    </form>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { currentUser } = useFrappeAuth();
  const ws = useWebsiteSettings();

  const [mode, setMode] = useState<"login" | "signup">("login");

  // /login#signup deep link (e.g. from the navbar Sign up button)
  useEffect(() => {
    if (window.location.hash === "#signup") {
      setMode("signup");
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      router.replace("/my-account");
    }
  }, [currentUser, router]);

  const signupAllowed = !!ws && !ws.disable_signup;
  const showSignup = mode === "signup" && signupAllowed;
  const logo = ws?.app_logo || brandImage(ws);
  const name = ws?.app_name || "__SPA__";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#112921] via-[#1d3a2c] to-[#4D6443] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link href="/" className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={name}
                className="h-10 rounded-lg bg-white/90 p-1"
              />
            ) : null}
            <span className="text-lg font-semibold tracking-wide">{name}</span>
          </Link>

          <div>
            <FadeIn>
              <h1 className="text-5xl leading-tight font-bold">
                Welcome
                <span className="block text-[#a9bba0]">back.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p className="mt-6 max-w-md text-white/75">
                Sign in to track your orders, download invoices, raise support
                requests and manage your account.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mt-10 grid max-w-md gap-3">
                {PERKS.map((perk) => (
                  <div
                    key={perk.label}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur"
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10">
                      <perk.icon className="size-4.5 text-[#a9bba0]" />
                    </span>
                    <span className="text-sm font-medium">{perk.label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 lg:justify-end">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground lg:hidden"
            >
              ← Home
            </Link>
            <ModeToggle />
          </div>
          <div className="flex flex-1 items-center justify-center p-6">
            <FadeIn y={16} className="w-full max-w-md">
              {/* Mobile brand */}
              <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={name} className="h-12" />
                ) : null}
                <span className="text-lg font-semibold">{name}</span>
              </div>

              {signupAllowed ? (
                <div className="mb-8 grid grid-cols-2 rounded-full border bg-muted/50 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors",
                      mode === "login"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Lock className="size-4" />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors",
                      mode === "signup"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <UserRoundPlus className="size-4" />
                    Sign Up
                  </button>
                </div>
              ) : null}

              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {showSignup ? "Create Your Account" : "Login to Your Account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {showSignup
                    ? "Join us — it only takes a minute"
                    : "Enter your credentials to access your account"}
                </p>
              </div>

              {showSignup ? (
                <SignupForm onDone={() => setMode("login")} />
              ) : (
                <LoginForm />
              )}

              <p className="mt-8 hidden text-center text-sm text-muted-foreground lg:block">
                <Link
                  href="/"
                  className="hover:text-foreground hover:underline"
                >
                  ← Back to home
                </Link>
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
      {ws?.show_footer_on_login ? <SiteFooter /> : null}
    </div>
  );
}
