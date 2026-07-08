"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Public site navigation (no auth required). */
const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, isLoading } = useFrappeAuth();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-semibold">
          __SPA__
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {!isLoading && !currentUser ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        ) : null}
        <Button asChild size="sm">
          <Link href="/dashboard">Open App</Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
      <p>
        __SPA__ — built on Frappe with Next.js, Tailwind CSS v4 and shadcn/ui.
      </p>
    </footer>
  );
}
