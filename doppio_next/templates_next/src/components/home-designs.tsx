"use client";

import Link from "next/link";
import { useState } from "react";
import { useFrappePostCall } from "frappe-react-sdk";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  Eye,
  FileText,
  LifeBuoy,
  Package,
  ShoppingBag,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSessionUser,
  useWebsiteSettings,
  type WebsiteSettings,
} from "@/lib/website-settings";

/* ------------------------------------------------------------------ */
/* Content: Adi Settings overrides with per-design defaults            */
/* ------------------------------------------------------------------ */

export interface HomeContent {
  title: string;
  tagline: string;
  ctaLabel: string;
  ctaUrl: string;
}

function contentFor(
  ws: WebsiteSettings | null,
  defaults: HomeContent
): HomeContent {
  return {
    title: ws?.homepage_title || defaults.title,
    tagline: ws?.homepage_tagline || defaults.tagline,
    ctaLabel: ws?.homepage_cta_label || defaults.ctaLabel,
    ctaUrl: ws?.homepage_cta_url || defaults.ctaUrl,
  };
}

function CtaButton({
  content,
  className,
  size = "lg",
}: {
  content: HomeContent;
  className?: string;
  size?: "lg" | "default";
}) {
  const external = /^https?:\/\//.test(content.ctaUrl);
  return (
    <Button asChild size={size} className={className}>
      {external ? (
        <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer">
          {content.ctaLabel}
          <ArrowRight className="size-4" />
        </a>
      ) : (
        <Link href={content.ctaUrl}>
          {content.ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Designs                                                             */
/* ------------------------------------------------------------------ */

function EcommerceDesign() {
  const ws = useWebsiteSettings();
  const content = contentFor(ws, {
    title: "Everything your customers love, in one store.",
    tagline:
      "Browse the catalog, track orders and pay online — synced live with our inventory.",
    ctaLabel: "Shop now",
    ctaUrl: "/login",
  });
  const products = [
    { name: "Signature Item", price: "₹2,499", tone: "from-[#4D6443]/80 to-[#112921]" },
    { name: "Best Seller", price: "₹1,299", tone: "from-[#7d9472]/80 to-[#4D6443]" },
    { name: "New Arrival", price: "₹3,999", tone: "from-[#112921] to-[#35492f]" },
  ];

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <FadeIn>
        <Badge variant="secondary" className="mb-4">
          <ShoppingBag className="size-3.5" />
          Online store
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          {content.tagline}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaButton content={content} />
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Bulk enquiry</Link>
          </Button>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeCheck className="size-4 text-primary" />
          Free shipping over ₹999 · Easy returns
        </p>
      </FadeIn>
      <StaggerContainer className="grid grid-cols-3 gap-3">
        {products.map((product) => (
          <StaggerItem key={product.name} className="h-full">
            <HoverLift className="h-full">
              <Card className="h-full overflow-hidden pt-0">
                <div className={`aspect-square bg-gradient-to-br ${product.tone}`} />
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.price}</p>
                </CardContent>
              </Card>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

function PortalDesign() {
  const ws = useWebsiteSettings();
  const content = contentFor(ws, {
    title: "Your account, at a glance.",
    tagline:
      "Orders, invoices and support — everything connected to your business with us, one login away.",
    ctaLabel: "Open my account",
    ctaUrl: "/my-account",
  });
  const stats = [
    { icon: Package, label: "Orders", value: "24" },
    { icon: FileText, label: "Invoices", value: "12" },
    { icon: LifeBuoy, label: "Open tickets", value: "2" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#112921] via-[#1d3a2c] to-[#4D6443] opacity-[0.07] dark:opacity-50" />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <FadeIn>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            {content.tagline}
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButton content={content} />
          </div>
        </FadeIn>
        <StaggerContainer className="mt-14 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="h-full">
              <Card className="h-full">
                <CardContent className="flex flex-col items-center gap-1 py-6">
                  <stat.icon className="size-5 text-primary" />
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function PersonalDesign() {
  const ws = useWebsiteSettings();
  const content = contentFor(ws, {
    title: ws?.app_name || "Your Name",
    tagline:
      "Designer, builder and problem-solver. I make simple, beautiful things for the web.",
    ctaLabel: "Get in touch",
    ctaUrl: "/contact",
  });

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <FadeIn>
        <p className="text-sm font-semibold tracking-[0.3em] text-primary uppercase">
          Hello, I&apos;m
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-7xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
          {content.tagline}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <CtaButton content={content} />
          <Button asChild size="lg" variant="ghost">
            <Link href="/about">About me</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}

function ErpnextDesign() {
  const ws = useWebsiteSettings();
  const content = contentFor(ws, {
    title: "One system for the whole company.",
    tagline:
      "Accounting, inventory, sales and HR on ERPNext — implemented and supported by Adimyra.",
    ctaLabel: "Book a consultation",
    ctaUrl: "/contact",
  });
  const points = ["Accounting & GST", "Inventory & Manufacturing", "Sales, CRM & HR"];

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <FadeIn>
        <Badge variant="secondary" className="mb-4">
          <Boxes className="size-3.5" />
          ERPNext
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          {content.tagline}
        </p>
        <ul className="mt-6 space-y-2">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10">
                <Check className="size-3 text-primary" />
              </span>
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <CtaButton content={content} />
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#112921] to-[#4D6443] text-white">
          <CardContent className="grid gap-6 p-8">
            <p className="text-sm font-medium text-white/70">This quarter</p>
            {[
              ["Revenue booked", "₹48.2L", "w-4/5"],
              ["Orders fulfilled", "312", "w-3/5"],
              ["On-time delivery", "97%", "w-11/12"],
            ].map(([label, value, width]) => (
              <div key={label as string}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-white/70">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/15">
                  <div className={`h-1.5 rounded-full bg-[#a9bba0] ${width}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}

function CustomDesign() {
  const ws = useWebsiteSettings();
  const content = contentFor(ws, {
    title: "Built different, built for you.",
    tagline:
      "Custom apps, automations and integrations — if you can describe it, we can ship it.",
    ctaLabel: "Start something",
    ctaUrl: "/contact",
  });
  const chips = ["Workflows", "Automations", "Integrations", "Dashboards", "APIs"];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-24 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#4D6443] to-[#112921] opacity-20 blur-3xl dark:opacity-40" />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <FadeIn>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Wand2 className="size-3.5 text-primary" />
            Custom software
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-[#4D6443] via-[#7d9472] to-[#112921] bg-clip-text text-transparent dark:from-[#a9bba0] dark:via-[#7d9472] dark:to-[#4D6443]">
              {content.title}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {content.tagline}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <Badge key={chip} variant="outline" className="px-3 py-1">
                {chip}
              </Badge>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <CtaButton content={content} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Registry + demo shell                                               */
/* ------------------------------------------------------------------ */

export const HOME_DESIGNS: Record<
  string,
  { name: string; description: string; Component: () => React.ReactNode }
> = {
  ecommerce: {
    name: "Shopfront",
    description: "Store hero with a product showcase",
    Component: EcommerceDesign,
  },
  portal: {
    name: "Portal",
    description: "Account-first hero with live stats",
    Component: PortalDesign,
  },
  personal: {
    name: "Studio",
    description: "Minimal personal / portfolio hero",
    Component: PersonalDesign,
  },
  erpnext: {
    name: "Enterprise",
    description: "ERP pitch with a metrics panel",
    Component: ErpnextDesign,
  },
  custom: {
    name: "Spark",
    description: "Bold gradient hero for custom builds",
    Component: CustomDesign,
  },
};

/** Banner above a demo: name it and offer "Use this" to site managers. */
export function DemoBanner({ designKey }: { designKey: string }) {
  const { sessionUser } = useSessionUser();
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const { call: setDesign } = useFrappePostCall(
    "__APP__.website_api.set_homepage_design"
  );
  const design = HOME_DESIGNS[designKey];

  async function useThis() {
    setSaving(true);
    try {
      await setDesign({ design: designKey });
      setApplied(true);
      toast.success(`Homepage now uses the ${design.name} design`);
    } catch {
      toast.error("Could not update — you need website manager access");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b bg-secondary/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <p className="flex items-center gap-2 text-sm">
          <Eye className="size-4 text-primary" />
          <span>
            Previewing the <strong>{design.name}</strong> design by Adimyra
            Systems —{" "}
            <span className="text-muted-foreground">
              want it customized further? We can shape every section for you.
            </span>
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/#designs">All designs</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">Contact us</Link>
          </Button>
          {sessionUser?.desk_access ? (
            <Button size="sm" onClick={useThis} disabled={saving || applied}>
              {applied ? (
                <>
                  <Check className="size-4" />
                  Homepage updated
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {saving ? "Applying..." : "Use this as homepage"}
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
