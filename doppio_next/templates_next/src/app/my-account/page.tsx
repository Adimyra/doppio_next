"use client";

import { useEffect, useState } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { FileText, LifeBuoy, Package, Plus } from "lucide-react";
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
import { useRequireAuth } from "@/lib/use-require-auth";
import { useSessionUser } from "@/lib/website-settings";

interface AccountData {
  orders: {
    name: string;
    transaction_date: string;
    status: string;
    grand_total: number;
    currency: string;
  }[];
  invoices: {
    name: string;
    posting_date: string;
    status: string;
    grand_total: number;
    currency: string;
  }[];
  issues: { name: string; subject: string; status: string; creation: string }[];
}

function ProfileCard() {
  const { sessionUser, refresh } = useSessionUser();
  const { call: updateProfile } = useFrappePostCall(
    "__APP__.website_api.update_my_profile"
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      setFirstName(sessionUser.first_name ?? "");
      setLastName(sessionUser.last_name ?? "");
      setMobileNo(sessionUser.mobile_no ?? "");
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
      });
      refresh();
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
      <CardHeader className="flex-row items-center gap-4">
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
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
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
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary">{status}</Badge>;
}

function EmptyRow({ span, text }: { span: number; text: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={span}
        className="py-8 text-center text-muted-foreground"
      >
        {text}
      </TableCell>
    </TableRow>
  );
}

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

export default function MyAccountPage() {
  const { currentUser } = useRequireAuth();
  const { data, mutate } = useFrappeGetCall<{ message: AccountData }>(
    "__APP__.website_api.get_my_account",
    undefined,
    currentUser ? "my-account" : null,
    { revalidateOnFocus: false }
  );
  const account = data?.message;

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <FadeIn>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="mt-1 text-muted-foreground">
            Your profile, orders, invoices and support requests.
          </p>
        </FadeIn>

        <div className="mt-8 grid gap-6">
          <FadeIn delay={0.05}>
            <ProfileCard />
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>Your recent sales orders</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account?.orders?.length ? (
                      account.orders.map((order) => (
                        <TableRow key={order.name}>
                          <TableCell className="font-medium">
                            {order.name}
                          </TableCell>
                          <TableCell>{order.transaction_date}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {order.currency} {order.grand_total}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow span={4} text="No orders yet." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Your recent invoices</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account?.invoices?.length ? (
                      account.invoices.map((invoice) => (
                        <TableRow key={invoice.name}>
                          <TableCell className="font-medium">
                            {invoice.name}
                          </TableCell>
                          <TableCell>{invoice.posting_date}</TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.currency} {invoice.grand_total}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow span={4} text="No invoices yet." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <LifeBuoy className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Support</CardTitle>
                    <CardDescription>
                      Issues you have raised with us
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <RaiseIssueForm onCreated={() => void mutate()} />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account?.issues?.length ? (
                      account.issues.map((issue) => (
                        <TableRow key={issue.name}>
                          <TableCell className="font-medium">
                            {issue.name}
                          </TableCell>
                          <TableCell>{issue.subject}</TableCell>
                          <TableCell>
                            <StatusBadge status={issue.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow span={3} text="No issues raised." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
