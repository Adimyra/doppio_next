"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFrappePostCall } from "frappe-react-sdk";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { AuthShell, PasswordInput } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordPage() {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Frappe's standard endpoint — validates the key from the reset email
  const { call: updatePassword } = useFrappePostCall(
    "frappe.core.doctype.user.user.update_password"
  );

  // ?key=... comes from the reset email (static export: read on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKey(params.get("key"));
    setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword({ new_password: password, key });
      setDone(true);
      toast.success("Password updated — you can log in now");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not update the password — the link may have expired";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      headline="Set a new"
      accent="password."
      description="Choose a strong password to secure your account — then log in and pick up right where you left off."
    >
      <div className="mb-8 flex justify-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
          {done ? (
            <CheckCircle2 className="size-6 text-primary" />
          ) : (
            <KeyRound className="size-6 text-primary" />
          )}
        </span>
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {done ? "Password Updated" : "Reset Your Password"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {done
            ? "Your new password is set. Log in to continue."
            : "Enter and confirm your new password below"}
        </p>
      </div>

      {done ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/login">
            Go to login
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : ready && !key ? (
        <div className="grid gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            This reset link is missing or incomplete. Request a new one and
            we&apos;ll email it to you.
          </p>
          <Button asChild size="lg">
            <Link href="/login#forgot">Request a new link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat the new password"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting || !ready}>
            {submitting ? "Updating..." : "Update password"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
