"use client";

import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Globe,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  FadeIn,
  HoverLift,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWebsiteSettings } from "@/lib/website-settings";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "Backed by Frappe's battle-tested authentication, roles and permissions.",
  },
  {
    icon: Gauge,
    title: "Lightning Fast",
    description:
      "Statically exported Next.js pages served straight from your site — no extra servers.",
  },
  {
    icon: Workflow,
    title: "ERPNext Inside",
    description:
      "Orders, invoices and support issues flow directly from your ERP in realtime.",
  },
  {
    icon: Smartphone,
    title: "Responsive by Design",
    description:
      "Every page adapts beautifully from phones to widescreen desktops.",
  },
  {
    icon: Sparkles,
    title: "Dark & Light Themes",
    description:
      "A polished theme system that follows your visitors' preference automatically.",
  },
  {
    icon: Globe,
    title: "Driven by Website Settings",
    description:
      "Branding, menus and access rules are managed from your Frappe desk — no redeploys.",
  },
];

export default function Home() {
  const ws = useWebsiteSettings();
  const name = ws?.app_name || "__SPA__";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#112921] via-[#1d3a2c] to-[#4D6443] opacity-[0.06] dark:opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
            <FadeIn>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Powered by ERPNext + Next.js
              </span>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
                {name}
                <span className="block bg-gradient-to-r from-[#4D6443] to-[#112921] bg-clip-text text-transparent dark:from-[#a9bba0] dark:to-[#4D6443]">
                  your business, beautifully online.
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                A modern customer portal connected to your ERP — track orders,
                download invoices, raise support requests and manage your
                account, all in one place.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Get started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact">Talk to us</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverLift>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="size-5 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* CTA banner */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <FadeIn>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#112921] to-[#4D6443] text-white">
              <CardContent className="flex flex-col items-center gap-6 px-8 py-14 text-center">
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
                  Want a portal like this for your company?
                </h2>
                <p className="max-w-xl text-white/80">
                  This experience was crafted by Adimyra Systems Private
                  Limited with ERPNext and Next.js. Tell us what you need —
                  we&apos;ll build it.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-[#112921] hover:bg-white/90"
                >
                  <a href="mailto:care@adimyra.com">
                    care@adimyra.com
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
