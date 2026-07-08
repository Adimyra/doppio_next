"use client";

import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] opacity-[0.06] dark:opacity-30" />
        <FadeIn className="relative text-center">
          <p className="bg-gradient-to-r from-[var(--brand-moss)] to-[var(--brand-deep)] bg-clip-text text-8xl font-bold tracking-tight text-transparent dark:from-[var(--brand-light)] dark:to-[var(--brand-moss)]">
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            This page wandered off
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
            Try searching, or head back home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">
                <Compass className="size-4" />
                Search the site
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/contact">
                Contact us
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  );
}
