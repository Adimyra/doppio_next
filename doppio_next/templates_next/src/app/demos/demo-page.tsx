"use client";

import { DemoBanner, HOME_DESIGNS } from "@/components/home-designs";
import { SiteFooter, SiteHeader } from "@/components/site-header";

/** Shared shell for /demos/<design> pages. */
export function DemoPage({ designKey }: { designKey: string }) {
  const design = HOME_DESIGNS[designKey];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <DemoBanner designKey={designKey} />
      <main className="flex-1">
        <design.Component />
      </main>
      <SiteFooter />
    </div>
  );
}
