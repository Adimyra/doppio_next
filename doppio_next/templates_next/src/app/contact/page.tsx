"use client";

import { useState } from "react";
import { ArrowRight, Mail, MapPin, MessageSquare } from "lucide-react";

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
          <div className="absolute inset-0 bg-gradient-to-br from-[#112921] via-[#1d3a2c] to-[#4D6443] opacity-[0.06] dark:opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-primary uppercase">
                Contact us
              </p>
              <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
                Tell us what you want to build
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                ERPNext, custom Frappe apps, Next.js portals — whatever it is,
                we&apos;d love to hear about it.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 lg:grid-cols-5">
          <FadeIn className="lg:col-span-2">
            <div className="flex h-full flex-col gap-4">
              <Card>
                <CardHeader>
                  <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <CardTitle>Email</CardTitle>
                  <CardDescription>
                    <a
                      href="mailto:care@adimyra.com"
                      className="font-medium text-primary hover:underline"
                    >
                      care@adimyra.com
                    </a>
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="size-5 text-primary" />
                  </div>
                  <CardTitle>Support</CardTitle>
                  <CardDescription>
                    Existing customer? Log in and raise an issue from My
                    Account — we track every request.
                  </CardDescription>
                </CardHeader>
              </Card>
              {ws?.address ? (
                <Card>
                  <CardHeader>
                    <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <CardTitle>Address</CardTitle>
                    <CardDescription>
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
                <form onSubmit={onSubmit} className="grid gap-4">
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
                      placeholder="Tell us about your project"
                      required
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    />
                  </div>
                  <Button type="submit" size="lg">
                    Send message
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
