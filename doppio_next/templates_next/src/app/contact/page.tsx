"use client";

import { useState } from "react";
import { ArrowRight, Globe, Mail, MapPin, MessageSquare } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebsiteSettings } from "@/lib/website-settings";

const CHANNELS = [
  {
    icon: Mail,
    title: "Email us",
    body: (
      <a
        href="mailto:care@adimyra.com"
        className="font-medium text-primary hover:underline"
      >
        care@adimyra.com
      </a>
    ),
  },
  {
    icon: Globe,
    title: "Visit our website",
    body: (
      <>
        <a
          href="https://adimyra.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          adimyra.com
        </a>
        <span className="mt-1 block">
          or reach us directly at{" "}
          <a
            href="https://adimyra.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            adimyra.com/contact
          </a>
        </span>
      </>
    ),
  },
  {
    icon: MessageSquare,
    title: "Support",
    body: (
      <>
        Existing customer? Log in and raise an issue from My Account — we
        track every request.
      </>
    ),
  },
];

export default function ContactPage() {
  const ws = useWebsiteSettings();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = `Hi Adimyra team,%0D%0A%0D%0A${encodeURIComponent(
      message
    )}%0D%0A%0D%0A— ${encodeURIComponent(name)}`;
    window.location.href = `mailto:care@adimyra.com?subject=${encodeURIComponent(
      subject || "Project enquiry"
    )}&body=${body}`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-mid)] to-[var(--brand-moss)] opacity-[0.06] dark:opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 py-16 text-center sm:py-20">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-primary uppercase">
                Contact us
              </p>
              <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
                Tell us what you want to build
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Websites, e-commerce stores, portals, ERPNext, custom software
                — we are Adimyra Systems Private Limited, and we&apos;d love to
                hear about your idea.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20 sm:pb-24">
          <div className="grid items-stretch gap-6 lg:grid-cols-5">
            <FadeIn className="lg:col-span-2">
              <div className="flex h-full flex-col gap-6">
                {CHANNELS.map((channel) => (
                  <Card key={channel.title} className="flex-1">
                    <CardHeader>
                      <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <channel.icon className="size-5 text-primary" />
                      </div>
                      <CardTitle>{channel.title}</CardTitle>
                      <CardDescription className="leading-relaxed">
                        {channel.body}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {ws?.address ? (
                  <Card className="flex-1">
                    <CardHeader>
                      <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="size-5 text-primary" />
                      </div>
                      <CardTitle>Address</CardTitle>
                      <CardDescription className="leading-relaxed">
                        <span
                          // Website Settings "Address" is sanitized rich text
                          dangerouslySetInnerHTML={{ __html: ws.address }}
                        />
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : null}
              </div>
            </FadeIn>

            <FadeIn delay={0.05} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    This opens your mail app with everything pre-filled.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="contact-name">Your name</Label>
                      <Input
                        id="contact-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact-subject">Subject</Label>
                      <Input
                        id="contact-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="I want to build..."
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact-message">Message</Label>
                      <textarea
                        id="contact-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your project — an online store, a company site, a customer portal, an ERPNext rollout..."
                        required
                        rows={7}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full">
                      Send message
                      <ArrowRight className="size-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
