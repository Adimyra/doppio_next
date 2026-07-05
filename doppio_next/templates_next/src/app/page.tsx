import Link from "next/link";

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

const FEATURES = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description:
      "Live document counts and a realtime ToDo feed straight from your Frappe site.",
  },
  {
    title: "Project monitoring",
    href: "/projects",
    description:
      "Track ERPNext projects with progress, priorities and overdue alerts.",
  },
  {
    title: "Portal",
    href: "/portal",
    description:
      "A personal view of the issues you raised and the ToDos assigned to you.",
  },
  {
    title: "Profile",
    href: "/profile",
    description:
      "View and edit your account details, saved directly to your User document.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              __SPA__
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A modern frontend for the __APP__ Frappe app — Next.js,
              TypeScript, Tailwind CSS v4 and shadcn/ui, wired to your Frappe
              backend with auth, realtime and typed APIs.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Learn more</Link>
              </Button>
            </div>
          </FadeIn>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <StaggerItem key={f.href}>
                <HoverLift className="h-full">
                  <Link href={f.href} className="group block h-full">
                    <Card className="h-full transition-colors group-hover:border-primary/50">
                      <CardHeader>
                        <CardTitle>{f.title}</CardTitle>
                        <CardDescription>{f.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
