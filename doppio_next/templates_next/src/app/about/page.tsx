"use client";

import Link from "next/link";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  ArrowRight,
  Blocks,
  Code2,
  Globe,
  History,
  Palette,
  Rocket,
  Server,
  UsersRound,
  Wrench,
} from "lucide-react";

import {
  FadeIn,
  HoverLift,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AboutSettings {
  page_title?: string;
  company_introduction?: string;
  company_history_heading?: string;
  company_history: { year?: string; highlight?: string }[];
  team_members_heading?: string;
  team_members_subtitle?: string;
  team_members: { full_name?: string; image_link?: string; bio?: string }[];
  footer?: string;
}

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

/* Brand glyphs (lucide dropped brand icons) — simple-icons paths. */
function BrandIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

const BRAND_PATHS = {
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z",
};

const SOCIAL_ICONS: [RegExp, React.ComponentType<{ className?: string }>][] =
  [
    [
      /linkedin\.com/i,
      (p) => <BrandIcon d={BRAND_PATHS.linkedin} {...p} />,
    ],
    [/(twitter|x)\.com/i, (p) => <BrandIcon d={BRAND_PATHS.x} {...p} />],
    [/github\.com/i, (p) => <BrandIcon d={BRAND_PATHS.github} {...p} />],
    [
      /instagram\.com/i,
      (p) => <BrandIcon d={BRAND_PATHS.instagram} {...p} />,
    ],
    [
      /facebook\.com/i,
      (p) => <BrandIcon d={BRAND_PATHS.facebook} {...p} />,
    ],
    [
      /(youtube\.com|youtu\.be)/i,
      (p) => <BrandIcon d={BRAND_PATHS.youtube} {...p} />,
    ],
  ];

/** Pull URLs out of a member bio: the cleaned text plus one icon
 *  link per URL (platform detected from the domain). */
function splitBio(bio?: string): {
  text: string;
  links: { url: string; Icon: React.ComponentType<{ className?: string }> }[];
} {
  if (!bio) return { text: "", links: [] };
  const links: {
    url: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [];
  const text = bio
    .replace(/https?:\/\/[^\s,]+/g, (url) => {
      const [, Icon] = SOCIAL_ICONS.find(([pattern]) => pattern.test(url)) ?? [
        null,
        Globe,
      ];
      links.push({ url, Icon });
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
  return { text, links };
}

/** About page fed by Frappe's About Us Settings. */
function DynamicAbout({ about }: { about: AboutSettings }) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] opacity-[0.06] dark:opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              About us
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              {about.page_title || "About us"}
            </h1>
          </FadeIn>
          {about.company_introduction ? (
            <FadeIn delay={0.05}>
              <div
                className="prose prose-lg dark:prose-invert mx-auto mt-8 max-w-2xl text-muted-foreground"
                // About Us Settings rich text (site managers only)
                dangerouslySetInnerHTML={{
                  __html: about.company_introduction,
                }}
              />
            </FadeIn>
          ) : null}
        </div>
      </section>

      {/* Company history timeline */}
      {about.company_history.length ? (
        <section className="mx-auto max-w-3xl px-6 pt-6 pb-16 sm:pt-8 sm:pb-20">
          <FadeIn>
            <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-bold tracking-tight">
              <History className="size-7 text-primary" />
              {about.company_history_heading || "Company History"}
            </h2>
          </FadeIn>
          <StaggerContainer className="mx-auto mt-12 max-w-2xl">
            {about.company_history.map((entry, index) => (
              <StaggerItem key={`${entry.year}-${index}`}>
                <div className="relative flex items-start gap-6 pb-10 last:pb-0">
                  {index < about.company_history.length - 1 ? (
                    <span className="absolute top-10 left-9 h-full w-px bg-border" />
                  ) : null}
                  <span className="z-10 inline-flex h-10 w-18 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {entry.year}
                  </span>
                  <p className="pt-2 text-muted-foreground">
                    {entry.highlight}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      ) : null}

      {/* Team */}
      {about.team_members.length ? (
        <section className="mx-auto max-w-5xl px-6 pt-2 pb-16 sm:pb-20">
          <FadeIn>
            <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-bold tracking-tight">
              <UsersRound className="size-7 text-primary" />
              {about.team_members_heading || "Meet Our Team"}
            </h2>
            {about.team_members_subtitle ? (
              <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                {about.team_members_subtitle}
              </p>
            ) : null}
          </FadeIn>
          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.team_members.map((member) => {
              const { text, links } = splitBio(member.bio);
              return (
                <StaggerItem key={member.full_name} className="h-full">
                  <HoverLift className="h-full">
                    <Card className="h-full">
                      <CardHeader className="flex flex-col items-center gap-1 text-center">
                        <Avatar className="mb-3 size-24 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                          {member.image_link ? (
                            <AvatarImage
                              src={member.image_link}
                              alt={member.full_name ?? ""}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                            {(member.full_name ?? "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg">
                          {member.full_name}
                        </CardTitle>
                        <CardDescription className="leading-relaxed">
                          {text}
                        </CardDescription>
                        {links.length ? (
                          <span className="mt-3 flex items-center justify-center gap-2">
                            {links.map(({ url, Icon }) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={url}
                                className="inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                              >
                                <Icon className="size-4" />
                              </a>
                            ))}
                          </span>
                        ) : null}
                      </CardHeader>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      ) : null}

      {/* Footer note */}
      {about.footer ? (
        <section className="mx-auto max-w-2xl px-6 pb-16 text-center sm:pb-20">
          <FadeIn>
            <div
              className="prose dark:prose-invert mx-auto text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: about.footer }}
            />
          </FadeIn>
        </section>
      ) : null}
    </>
  );
}

/** Fallback when About Us Settings is empty: the Adimyra showcase. */
function ShowcaseAbout() {
  return (
    <>
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
    </>
  );
}

export default function AboutPage() {
  const { data, isLoading } = useFrappeGetCall<{
    message: AboutSettings | null;
  }>("__APP__.website_api.get_about_settings", undefined, "about-settings", {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const about = data?.message ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {isLoading ? null : about ? (
          <DynamicAbout about={about} />
        ) : (
          <ShowcaseAbout />
        )}

        {/* CTA — generic when the page is fed by About Us Settings,
            the Adimyra pitch only on the built-in fallback */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-24">
          <FadeIn>
            <Card className="border-0 bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-moss)] text-white">
              <CardHeader className="flex flex-col items-center gap-2 px-8 py-14 text-center">
                <CardTitle className="text-3xl">
                  {about ? "Let's work together" : "Let's build yours"}
                </CardTitle>
                <CardDescription className="max-w-xl text-white/80">
                  {about
                    ? "Have a question or a project in mind? We'd love to hear from you."
                    : "Websites, portals, ERP rollouts, custom apps — tell us the idea and we'll take it from there."}
                </CardDescription>
                <Button
                  asChild
                  size="lg"
                  className="mt-4 w-auto bg-white text-[var(--brand-deep)] hover:bg-white/90"
                >
                  {about ? (
                    <Link href="/contact">
                      Contact us
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <a href="mailto:care@adimyra.com">care@adimyra.com</a>
                  )}
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
