"use client";

import { useEffect, useState } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  FileText,
  LifeBuoy,
  Package,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useSessionUser, useWebsiteSettings } from "@/lib/website-settings";

interface PortalSection {
  title: string;
  doctype: string;
}

interface PortalListRow {
  name: string;
  date: string;
  subject?: string;
  status?: string;
  total?: number;
  currency?: string;
}

interface PortalList {
  has_status: boolean;
  has_total: boolean;
  has_subject: boolean;
  rows: PortalListRow[];
}

function sectionIcon(doctype: string) {
  if (doctype === "Issue") return LifeBuoy;
  if (doctype.includes("Invoice")) return FileText;
  return Package;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function ProfileSection() {
  const ws = useWebsiteSettings();
  const { sessionUser, refresh } = useSessionUser();
  const { call: updateProfile } = useFrappePostCall(
    "__APP__.website_api.update_my_profile"
  );

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      setFirstName(sessionUser.first_name ?? "");
      setLastName(sessionUser.last_name ?? "");
      setMobileNo(sessionUser.mobile_no ?? "");
      setPhone(sessionUser.phone ?? "");
    }
  }, [sessionUser]);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        mobile_no: mobileNo,
        phone,
      });
      refresh();
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!sessionUser) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-8">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16">
            {sessionUser.user_image ? (
              <AvatarImage
                src={sessionUser.user_image}
                alt={sessionUser.full_name ?? ""}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xl text-primary">
              {(sessionUser.full_name ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-xl">
              {sessionUser.full_name}
            </CardTitle>
            <CardDescription className="truncate">
              {sessionUser.email}
            </CardDescription>
          </div>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit profile
          </Button>
        ) : null}
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {editing ? (
          <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile-no">Mobile number</Label>
              <Input
                id="mobile-no"
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Landline / alternate"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {[
              ["First name", sessionUser.first_name],
              ["Last name", sessionUser.last_name],
              ["Email", sessionUser.email],
              ["Mobile number", sessionUser.mobile_no],
              ["Phone", sessionUser.phone],
              [
                "Desk access",
                sessionUser.desk_access ? "Yes (System User)" : "No",
              ],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium">
                  {value || <span className="text-muted-foreground">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {ws?.show_account_deletion_link ? (
          <>
            <Separator className="my-6" />
            <p className="text-sm text-muted-foreground">
              Want to leave?{" "}
              {/* Frappe's data-deletion web form, outside the SPA basePath */}
              <a
                href="/request-to-delete-data?new=1"
                className="font-medium text-destructive hover:underline"
              >
                Request account deletion
              </a>
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Raise issue (shown on the Issues section)                           */
/* ------------------------------------------------------------------ */

function RaiseIssueForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: raiseIssue } = useFrappePostCall(
    "__APP__.website_api.raise_issue"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await raiseIssue({ subject, description });
      toast.success("Issue raised — our team will get back to you");
      setSubject("");
      setDescription("");
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Could not raise the issue");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Raise issue
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full gap-3 rounded-lg border p-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="issue-subject">Subject</Label>
        <Input
          id="issue-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Short summary of the problem"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="issue-description">Description</Label>
        <textarea
          id="issue-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What happened? What did you expect?"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Generic doctype section                                             */
/* ------------------------------------------------------------------ */

function DoctypeSection({ section }: { section: PortalSection }) {
  const { data, mutate } = useFrappeGetCall<{ message: PortalList }>(
    "__APP__.website_api.get_portal_list",
    { doctype: section.doctype },
    `portal-list-${section.doctype}`,
    { revalidateOnFocus: false }
  );
  const list = data?.message;
  const Icon = sectionIcon(section.doctype);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>
            Your recent {section.title.toLowerCase()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {section.doctype === "Issue" ? (
          <RaiseIssueForm onCreated={() => void mutate()} />
        ) : null}
        {!list ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                {list.has_subject ? <TableHead>Title</TableHead> : null}
                <TableHead>Date</TableHead>
                {list.has_status ? <TableHead>Status</TableHead> : null}
                {list.has_total ? (
                  <TableHead className="text-right">Total</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.length ? (
                list.rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    {list.has_subject ? (
                      <TableCell className="max-w-64 truncate">
                        {row.subject}
                      </TableCell>
                    ) : null}
                    <TableCell>{row.date}</TableCell>
                    {list.has_status ? (
                      <TableCell>
                        {row.status ? (
                          <Badge variant="secondary">{row.status}</Badge>
                        ) : null}
                      </TableCell>
                    ) : null}
                    {list.has_total ? (
                      <TableCell className="text-right">
                        {row.total != null
                          ? `${row.currency ?? ""} ${row.total}`
                          : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      2 +
                      (list.has_subject ? 1 : 0) +
                      (list.has_status ? 1 : 0) +
                      (list.has_total ? 1 : 0)
                    }
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nothing here yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MyAccountPage() {
  const { currentUser } = useRequireAuth();
  const [active, setActive] = useState("profile");
  const { data } = useFrappeGetCall<{ message: PortalSection[] }>(
    "__APP__.website_api.get_portal_sections",
    undefined,
    currentUser ? "portal-sections" : null,
    { revalidateOnFocus: false }
  );
  const sections = data?.message ?? [];
  const activeSection = sections.find((s) => s.doctype === active);

  if (!currentUser) {
    return null;
  }

  const navItems = [
    { key: "profile", title: "Profile", icon: UserRound },
    ...sections.map((section) => ({
      key: section.doctype,
      title: section.title,
      icon: sectionIcon(section.doctype),
    })),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <FadeIn>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="mt-1 text-muted-foreground">
            Your profile and everything connected to your account.
          </p>
        </FadeIn>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar (horizontal pills on mobile) */}
          <FadeIn delay={0.05}>
            <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.title}
                </button>
              ))}
            </nav>
          </FadeIn>

          {/* Content */}
          <FadeIn delay={0.1} key={active}>
            {active === "profile" ? (
              <ProfileSection />
            ) : activeSection ? (
              <DoctypeSection section={activeSection} />
            ) : null}
          </FadeIn>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
