"use client";

import { useState } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  ArrowRight,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

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

interface ContactSettings {
  heading?: string;
  introduction?: string;
  query_options: string[];
  address_lines: string[];
  phone?: string;
  email_id?: string;
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {children}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/** Real submission through Frappe's contact endpoint (guest-safe,
 *  rate-limited, forwards to Contact Us Settings forward_to_email). */
function ContactForm({ queryOptions }: { queryOptions: string[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [queryType, setQueryType] = useState(queryOptions[0] ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: sendMessage } = useFrappePostCall(
    "frappe.www.contact.send_message"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendMessage({
        sender: email,
        message: `${message}\n\n— ${name}`,
        subject: queryType ? `${queryType}: Website Query` : "Website Query",
      });
      toast.success("Message sent — we'll get back to you soon");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Could not send your message, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="contact-email">Your email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      {queryOptions.length ? (
        <div className="grid gap-2">
          <Label htmlFor="contact-query">What is this about?</Label>
          <select
            id="contact-query"
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {queryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your query"
          required
          rows={6}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Send message"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

/** Fallback form when Contact Us Settings is empty: opens the mail app. */
function MailtoForm() {
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
  );
}

export default function ContactPage() {
  const ws = useWebsiteSettings();
  const { data } = useFrappeGetCall<{ message: ContactSettings | null }>(
    "__APP__.website_api.get_contact_settings",
    undefined,
    "contact-settings",
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const contact = data?.message ?? null;

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
                {contact?.heading || "Tell us what you want to build"}
              </h1>
              {contact?.introduction ? (
                <div
                  className="prose dark:prose-invert mx-auto mt-5 max-w-2xl text-muted-foreground"
                  // Contact Us Settings rich text (site managers only)
                  dangerouslySetInnerHTML={{ __html: contact.introduction }}
                />
              ) : (
                <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                  Websites, e-commerce stores, portals, ERPNext, custom
                  software — we are Adimyra Systems Private Limited, and
                  we&apos;d love to hear about your idea.
                </p>
              )}
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20 sm:pb-24">
          <div className="grid items-stretch gap-6 lg:grid-cols-5">
            <FadeIn className="lg:col-span-2">
              <div className="flex h-full flex-col gap-6">
                {contact ? (
                  <>
                    {contact.email_id || contact.phone ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>Get in touch</CardTitle>
                          <CardDescription>
                            We&apos;re quick to respond on both.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                          {contact.email_id ? (
                            <a
                              href={`mailto:${contact.email_id}`}
                              className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                            >
                              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Mail className="size-5 text-primary" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs text-muted-foreground">
                                  Email
                                </span>
                                <span className="block truncate text-sm font-medium group-hover:text-primary">
                                  {contact.email_id}
                                </span>
                              </span>
                            </a>
                          ) : null}
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                            >
                              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Phone className="size-5 text-primary" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs text-muted-foreground">
                                  Phone
                                </span>
                                <span className="block truncate text-sm font-medium group-hover:text-primary">
                                  {contact.phone}
                                </span>
                              </span>
                            </a>
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}
                    {contact.address_lines.length ? (
                      <Card className="flex flex-1 flex-col">
                        <CardHeader>
                          <div className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="size-5 text-primary" />
                          </div>
                          <CardTitle>Visit us</CardTitle>
                          <CardDescription className="leading-relaxed">
                            {contact.address_lines.map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-2">
                          <span className="block min-h-40 flex-1 overflow-hidden rounded-lg border">
                            {/* keyless Google Maps embed pinned on the address */}
                            <iframe
                              title="Location map"
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                contact.address_lines.join(", ")
                              )}&z=15&output=embed`}
                              className="block h-full min-h-40 w-full border-0 dark:brightness-90"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(
                              contact.address_lines.join(", ")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Open in Google Maps →
                          </a>
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                ) : (
                  <>
                    <InfoCard icon={Mail} title="Email us">
                      <a
                        href="mailto:care@adimyra.com"
                        className="font-medium text-primary hover:underline"
                      >
                        care@adimyra.com
                      </a>
                    </InfoCard>
                    <InfoCard icon={Globe} title="Visit our website">
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
                    </InfoCard>
                    <InfoCard icon={MessageSquare} title="Support">
                      Existing customer? Log in and raise an issue from My
                      Account — we track every request.
                    </InfoCard>
                    {ws?.address ? (
                      <InfoCard icon={MapPin} title="Address">
                        <span
                          // Website Settings "Address" is sanitized rich text
                          dangerouslySetInnerHTML={{ __html: ws.address }}
                        />
                      </InfoCard>
                    ) : null}
                  </>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={0.05} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    {contact
                      ? "We'll reply to the email address you enter below."
                      : "This opens your mail app with everything pre-filled."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contact ? (
                    <ContactForm queryOptions={contact.query_options} />
                  ) : (
                    <MailtoForm />
                  )}
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
