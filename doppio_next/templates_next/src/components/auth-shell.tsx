"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Gauge, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { SiteFooter } from "@/components/site-header";
import { ModeToggle } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { brandImage, useWebsiteSettings } from "@/lib/website-settings";

/** Password field with a lock icon and show/hide toggle. */
export function PasswordInput({
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

const PERKS = [
  { icon: ShieldCheck, label: "Secure & Reliable" },
  { icon: Gauge, label: "Lightning Fast Experience" },
  { icon: Sparkles, label: "Realtime ERP Data" },
];

/**
 * Split-screen shell shared by the auth pages (login, signup, forgot
 * and reset password): brand gradient panel on the left, the form
 * (children) on the right, theme toggle on top.
 */
export function AuthShell({
  headline,
  accent,
  description,
  children,
}: {
  headline: string;
  accent: string;
  description: string;
  children: React.ReactNode;
}) {
  const ws = useWebsiteSettings();
  const logo = ws?.app_logo || brandImage(ws);
  const name = ws?.app_name || "__SPA__";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
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
                {headline}
                <span className="block text-[var(--brand-light)]">{accent}</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p className="mt-6 max-w-md text-white/75">{description}</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mt-10 grid max-w-md gap-3">
                {PERKS.map((perk) => (
                  <div
                    key={perk.label}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur"
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10">
                      <perk.icon className="size-4.5 text-[var(--brand-light)]" />
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

              {children}

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
