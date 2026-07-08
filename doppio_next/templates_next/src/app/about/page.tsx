"use client";

import {
  ArrowRight,
  Blocks,
  Code2,
  Palette,
  Rocket,
  Server,
  Wrench,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SERVICES = [
  {
    icon: Server,
    title: "ERPNext Implementation",
    description:
      "End-to-end ERPNext rollouts — accounting, inventory, manufacturing, HR — tailored to how your business actually runs.",
  },
  {
    icon: Code2,
    title: "Custom Frappe Apps",
    description:
      "Purpose-built doctypes, workflows and automations on the Frappe framework, integrated cleanly with your ERP.",
  },
  {
    icon: Palette,
    title: "Next.js Frontends",
    description:
      "Fast, beautiful customer portals and websites — like this one — wired directly to your Frappe backend.",
  },
  {
    icon: Blocks,
    title: "Integrations",
    description:
      "Payments, logistics, WhatsApp, e-commerce marketplaces — we connect ERPNext to the tools you rely on.",
  },
  {
    icon: Wrench,
    title: "Support & Maintenance",
    description:
      "Upgrades, performance tuning and day-to-day care for benches, sites and custom apps.",
  },
  {
    icon: Rocket,
    title: "Launch & Scale",
    description:
      "From a single-store pilot to multi-company operations — we grow the system as you grow.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] opacity-[0.06] dark:opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:py-28">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-primary uppercase">
                About this site
              </p>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Built by{" "}
                <span className="bg-gradient-to-r from-[var(--brand-moss)] to-[var(--brand-deep)] bg-clip-text text-transparent dark:from-[var(--brand-light)] dark:to-[var(--brand-moss)]">
                  Adimyra Systems Private Limited
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                This portal was created with ERPNext and Next.js — open-source
                ERP power underneath, a modern web experience on top. We design
                and build systems like this for businesses of every size.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <a href="mailto:care@adimyra.com">
                    Start a project
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-6 pt-2 pb-24 sm:pt-4">
          <FadeIn>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              What we do
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Whatever you want to build on Frappe, ERPNext or the modern web —
              we can do that here.
            </p>
          </FadeIn>
          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <StaggerItem key={service.title} className="h-full">
                <HoverLift className="h-full">
                  <Card className="h-full">
                    <CardHeader>
                      <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <service.icon className="size-5 text-primary" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <FadeIn>
            <Card className="border-0 bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-moss)] text-white">
              <CardHeader className="items-center px-8 py-14 text-center">
                <CardTitle className="text-3xl">
                  Let&apos;s build yours
                </CardTitle>
                <CardDescription className="max-w-xl text-white/80">
                  Websites, portals, ERP rollouts, custom apps — tell us the
                  idea and we&apos;ll take it from there.
                </CardDescription>
                <Button
                  asChild
                  size="lg"
                  className="mt-6 bg-white text-[var(--brand-deep)] hover:bg-white/90"
                >
                  <a href="mailto:care@adimyra.com">care@adimyra.com</a>
                </Button>
              </CardHeader>
            </Card>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
