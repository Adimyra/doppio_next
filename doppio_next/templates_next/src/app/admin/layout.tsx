"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFrappeGetDocCount } from "frappe-react-sdk";
import { ArrowLeft, Menu, ShieldAlert } from "lucide-react";

import { useRequireAuth } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/logs", label: "Error Logs" },
];

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-4">
      {NAV.map((item) => (
        <Button
          key={item.href}
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            "justify-start",
            pathname === item.href && "bg-accent text-accent-foreground"
          )}
        >
          <Link
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        </Button>
      ))}
      <Separator className="my-2" />
      <Button asChild variant="ghost" size="sm" className="justify-start">
        <Link href="/dashboard" onClick={onNavigate}>
          <ArrowLeft className="mr-1 size-4" />
          Back to app
        </Link>
      </Button>
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading } = useRequireAuth();
  const [open, setOpen] = useState(false);

  // Access probe: listing Users over REST requires admin-level permissions.
  // Frappe (not the client) is the real gate — this only shapes the UI.
  const { error: accessError, isLoading: probeLoading } =
    useFrappeGetDocCount("User");

  const checking = authLoading || probeLoading;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-muted/40 md:block">
        <div className="px-4 pt-5">
          <p className="text-sm font-semibold">__SPA__ admin</p>
          <p className="text-xs text-muted-foreground">Site administration</p>
        </div>
        <AdminNav />
      </aside>

      <div className="flex-1">
        {/* Mobile header */}
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open admin menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-4 pt-5 text-sm font-semibold">
                __SPA__ admin
              </SheetTitle>
              <AdminNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="text-sm font-semibold">__SPA__ admin</p>
        </header>

        {checking ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : accessError ? (
          <div className="flex items-center justify-center p-6 pt-24">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  Your account does not have administrator permissions on this
                  site. Ask a System Manager if you believe this is a mistake.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
