"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useFrappeAuth,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { AuthShell, PasswordInput } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useWebsiteSettings } from "@/lib/website-settings";

const DIAL_CODES = ["+91", "+1", "+44", "+61", "+65", "+971"];

type Mode = "login" | "signup" | "forgot";

/** Frappe's ?redirect-to= (forwarded by the /login redirect) — only
 *  same-site absolute paths are honored. */
function redirectTarget(): string | null {
  const target = new URLSearchParams(window.location.search).get(
    "redirect-to"
  );
  return target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : null;
}

interface SocialProvider {
  name: string;
  provider_name: string;
  icon?: string;
  auth_url: string;
}

/** Social Login Keys (Google, GitHub, ...) — same providers Frappe's
 *  own login page offers, straight into the OAuth flow. */
function SocialLogins() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    setRedirectTo(redirectTarget() ?? "/__SPA__/my-account");
  }, []);

  const { data } = useFrappeGetCall<{ message: SocialProvider[] }>(
    "__APP__.website_api.get_social_logins",
    { redirect_to: redirectTo ?? "/" },
    redirectTo ? `social-logins-${redirectTo}` : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const providers = data?.message ?? [];

  if (!providers.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 grid gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.name}
            type="button"
            variant="outline"
            size="lg"
            onClick={() => window.location.assign(provider.auth_url)}
          >
            {provider.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.icon} alt="" className="size-4" />
            ) : null}
            Login with {provider.provider_name || provider.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
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
      const target = redirectTarget();
      if (target) {
        // may point outside the SPA (e.g. /app), so hard-navigate
        window.location.assign(target);
        return;
      }
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
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
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

function TermsDialog({ content }: { content?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-medium text-primary hover:underline"
        >
          Terms &amp; Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms &amp; Conditions</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2 text-sm">
          {content ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              // Text Editor content from Website Settings (site managers only)
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-muted-foreground">
              No terms have been published yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const ws = useWebsiteSettings();
  const requireTerms = !!ws?.require_terms;
  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: signUp } = useFrappePostCall("__APP__.website_api.sign_up");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requireTerms && !agreed) {
      toast.error("Please accept the Terms & Conditions to continue");
      return;
    }
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
      {requireTerms ? (
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(value) => setAgreed(value === true)}
            className="mt-0.5"
          />
          <p className="text-sm text-muted-foreground">
            <Label htmlFor="terms" className="inline font-normal">
              I agree to the
            </Label>{" "}
            <TermsDialog content={ws?.terms_content} />
          </p>
        </div>
      ) : null}
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

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Frappe's standard reset flow — mails a link to /update-password
  const { call: resetPassword } = useFrappePostCall(
    "frappe.core.doctype.user.user.reset_password"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword({ user: email });
      setSent(true);
      toast.success("Reset link sent — check your email");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not send the reset link";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-4 text-center">
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a password reset link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Open it
          to set a new password.
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="forgot-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="forgot-email"
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
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Sending link..." : "Send reset link"}
        <ArrowRight className="size-4" />
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Back to login
      </button>
    </form>
  );
}

const COPY: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: "Login to Your Account",
    subtitle: "Enter your credentials to access your account",
  },
  signup: {
    title: "Create Your Account",
    subtitle: "Join us — it only takes a minute",
  },
  forgot: {
    title: "Forgot Your Password?",
    subtitle: "We'll email you a link to reset it",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { currentUser } = useFrappeAuth();
  const ws = useWebsiteSettings();

  const [mode, setMode] = useState<Mode>("login");

  // /login#signup and /login#forgot deep links
  useEffect(() => {
    if (window.location.hash === "#signup") setMode("signup");
    if (window.location.hash === "#forgot") setMode("forgot");
  }, []);

  useEffect(() => {
    if (currentUser) {
      const target = redirectTarget();
      if (target) {
        window.location.assign(target);
      } else {
        router.replace("/my-account");
      }
    }
  }, [currentUser, router]);

  const signupAllowed = !!ws && !ws.disable_signup;
  const effectiveMode: Mode =
    mode === "signup" && !signupAllowed ? "login" : mode;
  const copy = COPY[effectiveMode];

  return (
    <AuthShell
      headline="Welcome"
      accent="back."
      description="Sign in to track your orders, download invoices, raise support requests and manage your account."
    >
      {signupAllowed && effectiveMode !== "forgot" ? (
        <div className="mb-8 grid grid-cols-2 rounded-full border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors",
              effectiveMode === "login"
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
              effectiveMode === "signup"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserRoundPlus className="size-4" />
            Sign Up
          </button>
        </div>
      ) : null}

      {effectiveMode === "forgot" ? (
        <div className="mb-8 flex justify-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-6 text-primary" />
          </span>
        </div>
      ) : null}

      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      {effectiveMode === "signup" ? (
        <SignupForm onDone={() => setMode("login")} />
      ) : effectiveMode === "forgot" ? (
        <ForgotForm onBack={() => setMode("login")} />
      ) : (
        <>
          <LoginForm onForgot={() => setMode("forgot")} />
          <SocialLogins />
        </>
      )}
    </AuthShell>
  );
}
