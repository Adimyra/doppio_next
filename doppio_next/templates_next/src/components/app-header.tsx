"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/portal", label: "Portal" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useFrappeAuth();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-lg font-semibold">__SPA__</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full" size="icon">
            <Avatar>
              <AvatarFallback>
                {(currentUser ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="max-w-56 truncate">
            {currentUser ?? "Not logged in"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">My profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin panel</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

/** Shared client-side auth guard for pages behind login. */
export function useRequireAuth() {
  const router = useRouter();
  const { currentUser, isLoading } = useFrappeAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  return { currentUser, isLoading };
}
