import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "About us | __SPA__",
};

const VALUES = [
  {
    title: "Open by default",
    description:
      "Built on Frappe and open web standards — your data stays yours, with a full API underneath every screen.",
  },
  {
    title: "Fast where it matters",
    description:
      "A static-first frontend that loads instantly, backed by realtime updates when your data changes.",
  },
  {
    title: "Designed for daily work",
    description:
      "Accessible, keyboard-friendly UI built with shadcn/ui, made for the people who use it every day.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 py-16">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">About us</h1>
          <p className="text-lg text-muted-foreground">
            We build __APP__ — business software on the Frappe/ERPNext
            platform, with a modern web experience on top. This site is its
            frontend: fast, secure and connected to the same backend that
            powers our operations.
          </p>
          <p className="text-muted-foreground">
            Replace this copy with your organization&apos;s real story: what
            you do, who you serve, and why you built this product. This page
            is a static route, so it costs nothing to serve and is indexed by
            search engines out of the box.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What we value</h2>
          <div className="grid gap-4">
            {VALUES.map((v) => (
              <Card key={v.title}>
                <CardHeader>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                  <CardDescription>{v.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Get in touch</h2>
          <p className="text-muted-foreground">
            Email us at{" "}
            <a
              href="mailto:hello@example.com"
              className="font-medium underline underline-offset-4"
            >
              hello@example.com
            </a>{" "}
            — or open an issue from your{" "}
            <Link
              href="/portal"
              className="font-medium underline underline-offset-4"
            >
              portal
            </Link>{" "}
            if you already have an account.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
