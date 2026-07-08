"use client";

import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Globe,
  LayoutTemplate,
  Mail,
  ShoppingCart,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";

import {
  FadeIn,
  HoverLift,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { HOME_DESIGNS } from "@/components/home-designs";
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

const SERVICES = [
  {
    icon: ShoppingCart,
    demo: "/demos/ecommerce",
    title: "E-commerce Sites",
    description:
      "Online stores with catalogs, carts and payments — inventory and billing flowing straight into ERPNext.",
  },
  {
    icon: LayoutTemplate,
    demo: "/demos/portal",
    title: "Business Portals",
    description:
      "Customer portals like this one — orders, invoices, support and account management in one clean interface.",
  },
  {
    icon: UserRound,
    demo: "/demos/personal",
    title: "Personal & Company Sites",
    description:
      "Portfolios, landing pages and corporate websites — fast, responsive and beautifully designed.",
  },
  {
    icon: Workflow,
    demo: "/demos/erpnext",
    title: "ERPNext & Frappe",
    description:
      "Full ERP implementations — accounting, inventory, HR, manufacturing — tailored to how your business runs.",
  },
  {
    icon: Blocks,
    demo: "/demos/custom",
    title: "Custom Functions & Apps",
    description:
      "Custom doctypes, workflows, automations and integrations — whatever function your business needs, we build it.",
  },
  {
    icon: Globe,
    demo: "/contact",
    title: "More Pages, Anytime",
    description:
      "Need another page, a new feature or a redesign later? We keep building as your business grows.",
  },
];

export default function Home() {
  const ws = useWebsiteSettings();
  const designKey = ws?.homepage_design;
  const design =
    designKey && designKey !== "classic" ? HOME_DESIGNS[designKey] : null;

  if (design) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <design.Component />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] opacity-[0.06] dark:opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
            <FadeIn>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Adimyra Systems Private Limited
              </span>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
                Whatever you imagine,
                <span className="block bg-gradient-to-r from-[var(--brand-moss)] to-[var(--brand-deep)] bg-clip-text text-transparent dark:from-[var(--brand-light)] dark:to-[var(--brand-moss)]">
                  we design &amp; build it.
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Websites, e-commerce stores, customer portals, custom software
                and full ERPNext implementations — pages, functions and
                features exactly the way you want them. This very site is one
                of our builds.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Contact us
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href="https://adimyra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit adimyra.com
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/login">Customer login</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Services */}
        <section
          id="designs"
          className="mx-auto max-w-6xl scroll-mt-20 px-6 pt-2 pb-20 sm:pt-4 sm:pb-24"
        >
          <FadeIn>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              What we can build for you
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              All types of sites and software, powered by Frappe, ERPNext and
              Next.js — click any card to see a live demo.
            </p>
          </FadeIn>
          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <StaggerItem key={service.title} className="h-full">
                <HoverLift className="h-full">
                  <Link href={service.demo} className="block h-full">
                    <Card className="h-full transition-colors hover:border-primary/40">
                      <CardHeader>
                        <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <service.icon className="size-5 text-primary" />
                        </div>
                        <CardTitle>{service.title}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                        <p className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
                          {service.demo === "/contact" ? "Talk to us" : "View demo"}
                          <ArrowRight className="size-3.5" />
                        </p>
                      </CardHeader>
                    </Card>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* CTA banner */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-24">
          <FadeIn>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-moss)] text-white">
              <CardContent className="flex flex-col items-center gap-6 px-8 py-14 text-center">
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
                  Tell us what you want — we&apos;ll build it.
                </h2>
                <p className="max-w-xl text-white/80">
                  Contact us, mail us, or visit our site. From a single landing
                  page to a complete ERP-connected platform, Adimyra Systems
                  Private Limited makes it real.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-[var(--brand-deep)] hover:bg-white/90"
                  >
                    <Link href="/contact">
                      Contact us
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href="mailto:care@adimyra.com">
                      <Mail className="size-4" />
                      Mail us
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-white/60">
                  or visit{" "}
                  <a
                    href="https://adimyra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white/90 underline-offset-2 hover:underline"
                  >
                    adimyra.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
