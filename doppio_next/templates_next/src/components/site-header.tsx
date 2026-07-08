"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFrappeAuth, useFrappePostCall } from "frappe-react-sdk";
import { toast } from "sonner";
import { ChevronDown, LayoutDashboard, LogOut, Search, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  brandImage,
  resolveItemUrl,
  useSessionUser,
  useWebsiteSettings,
  type TopBarItem,
} from "@/lib/website-settings";

/** Fallback nav used until Website Settings load (or when empty). */
const DEFAULT_NAV: TopBarItem[] = [
  { label: "Home", url: "/" },
  { label: "About", url: "/about" },
  { label: "Contact", url: "/contact" },
];

function ItemAnchor({
  item,
  className,
  children,
}: {
  item: TopBarItem;
  className?: string;
  children: React.ReactNode;
}) {
  const { href, external } = resolveItemUrl(item.url);
  return external ? (
    <a
      href={href}
      className={className}
      target={item.open_in_new_tab ? "_blank" : undefined}
      rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function NavDropdown({
  item,
  childItems,
  className,
}: {
  item: TopBarItem;
  childItems: TopBarItem[];
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          {item.label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {childItems.map((child) => (
          <DropdownMenuItem key={child.label} asChild>
            <ItemAnchor item={child}>{child.label}</ItemAnchor>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavbarSearch() {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (typeof q === "string" && q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden md:block">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        placeholder="Search..."
        className="h-8 w-44 pl-8 text-sm"
      />
    </form>
  );
}

function UserMenu() {
  const router = useRouter();
  const { logout } = useFrappeAuth();
  const { sessionUser } = useSessionUser();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  const initial = (sessionUser?.full_name ?? sessionUser?.user ?? "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full" size="icon">
          <Avatar className="size-8">
            {sessionUser?.user_image ? (
              <AvatarImage
                src={sessionUser.user_image}
                alt={sessionUser.full_name ?? ""}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{sessionUser?.full_name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {sessionUser?.user}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/my-account">
            <UserRound className="size-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        {sessionUser?.desk_access ? (
          <DropdownMenuItem asChild>
            {/* Frappe Desk lives outside the SPA basePath */}
            <a href="/app">
              <LayoutDashboard className="size-4" />
              Desk
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, isLoading } = useFrappeAuth();
  const ws = useWebsiteSettings();

  const items = ws?.top_bar_items?.length ? ws.top_bar_items : DEFAULT_NAV;
  const topLevel = items.filter((item) => !item.parent_label);
  const childrenOf = (label: string) =>
    items.filter((item) => item.parent_label === label);

  const logo = brandImage(ws);

  // Custom navbar background from Adi Settings (Plain color / Gradient)
  const navbarBg =
    ws?.navbar_style === "Plain" && ws.navbar_color
      ? { background: ws.navbar_color }
      : ws?.navbar_style === "Gradient" &&
          ws.navbar_gradient_from &&
          ws.navbar_gradient_to
        ? {
            background: `linear-gradient(90deg, ${ws.navbar_gradient_from}, ${ws.navbar_gradient_to})`,
          }
        : undefined;
  const darkText = ws?.navbar_text === "Dark";
  const navGhost = navbarBg
    ? darkText
      ? "text-[var(--brand-deep)] hover:bg-black/10 hover:text-[var(--brand-deep)]"
      : "text-white hover:bg-white/15 hover:text-white"
    : "";
  const navActive = navbarBg
    ? darkText
      ? "bg-black/10"
      : "bg-white/20"
    : "bg-accent text-accent-foreground";

  return (
    <>
      {ws?.banner_html ? (
        <div
          className="border-b bg-secondary/60 px-6 py-2 text-center text-sm [&_a]:text-primary [&_a]:underline"
          // Website Settings "Banner HTML" (site managers only)
          dangerouslySetInnerHTML={{ __html: ws.banner_html }}
        />
      ) : null}
    <header
      style={navbarBg}
      className={cn(
        "sticky top-0 z-40 border-b",
        navbarBg
          ? darkText
            ? "border-black/10 text-[var(--brand-deep)]"
            : "border-white/15 text-white"
          : "bg-background/80 backdrop-blur"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={ws?.app_name || "__SPA__"}
                className="h-7"
              />
            ) : (
              <span className="text-lg font-semibold">
                {ws?.app_name || "__SPA__"}
              </span>
            )}
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {topLevel.map((item) => {
              const kids = childrenOf(item.label);
              return kids.length ? (
                <NavDropdown
                  key={item.label}
                  item={item}
                  childItems={kids}
                  className={navGhost}
                />
              ) : (
                <Button
                  key={item.label}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    navGhost,
                    pathname === resolveItemUrl(item.url).href && navActive
                  )}
                >
                  <ItemAnchor item={item}>{item.label}</ItemAnchor>
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ws?.navbar_search ? <NavbarSearch /> : null}
          <ModeToggle className={navGhost} />
          {ws?.call_to_action && ws?.call_to_action_url ? (
            <Button asChild size="sm">
              {/^https?:\/\//.test(ws.call_to_action_url) ? (
                <a
                  href={ws.call_to_action_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ws.call_to_action}
                </a>
              ) : (
                <Link href={resolveItemUrl(ws.call_to_action_url).href}>
                  {ws.call_to_action}
                </Link>
              )}
            </Button>
          ) : null}
          {isLoading ? (
            <Skeleton className="size-8 rounded-full" />
          ) : currentUser ? (
            <UserMenu />
          ) : (
            <>
              {!ws?.hide_login ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
              ) : null}
              {ws && !ws.disable_signup && !ws.hide_login ? (
                <Button asChild size="sm">
                  <Link href="/login#signup">Sign up</Link>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: subscribe } = useFrappePostCall(
    "__APP__.website_api.subscribe"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await subscribe({ email });
      toast.success(res?.message || "Subscribed — thank you!");
      setEmail("");
    } catch {
      toast.error("Could not subscribe, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <p className="text-sm font-medium">Stay in the loop</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Product updates and offers — no spam.
      </p>
      <div className="mt-2 flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-9 max-w-52"
        />
        <Button type="submit" size="sm" className="h-9" disabled={submitting}>
          {submitting ? "..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}

export function SiteFooter() {
  const ws = useWebsiteSettings();
  const logo = ws?.footer_logo || brandImage(ws);
  const footerItems = ws?.footer_items ?? [];
  const year = new Date().getFullYear();

  // Group by parent_label: parents (or loose links) become columns —
  // a parent label is a heading, never a link.
  const childrenOf = (label: string) =>
    footerItems.filter((item) => item.parent_label === label);
  const groups = footerItems
    .filter((item) => !item.parent_label && childrenOf(item.label).length)
    .map((item) => ({ heading: item.label, links: childrenOf(item.label) }));
  const loose = footerItems.filter(
    (item) => !item.parent_label && !childrenOf(item.label).length && item.url
  );
  const columns = [
    ...groups,
    ...(loose.length ? [{ heading: "Links", links: loose }] : []),
  ];
  const fallbackColumns = [
    {
      heading: "Links",
      links: [
        { label: "Home", url: "/" },
        { label: "About", url: "/about" },
        { label: "Contact", url: "/contact" },
      ] as TopBarItem[],
    },
  ];

  // Footer signup = newsletter subscribers (Email Group "Website")
  const showNewsletter = !!ws && !ws.hide_footer_signup;

  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={ws?.app_name || "__SPA__"}
                className="h-9"
              />
            ) : null}
            <span className="bg-gradient-to-r from-[var(--brand-deep)] to-[var(--brand-moss)] bg-clip-text text-xl font-bold tracking-tight text-transparent capitalize dark:from-[var(--brand-light)] dark:to-[var(--brand-moss)]">
              {ws?.app_name || "__SPA__"}
            </span>
          </Link>
          {ws?.address ? (
            <div
              className="mt-4 text-sm whitespace-pre-line text-muted-foreground [&_a]:underline"
              // Website Settings "Address" is sanitized rich text from the site
              dangerouslySetInnerHTML={{ __html: ws.address }}
            />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Built on Frappe with Next.js, Tailwind CSS and shadcn/ui.
            </p>
          )}
          {showNewsletter ? <NewsletterForm /> : null}
        </div>

        {(columns.length ? columns : fallbackColumns).map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold">{column.heading}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {column.links.map((item) => (
                <li key={item.label}>
                  <ItemAnchor
                    item={item}
                    className="hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </ItemAnchor>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold">Get in touch</h3>
          <p className="mt-4 text-sm text-muted-foreground">
            {ws?.footer_contact_text ||
              "Want a portal like this for your business? We build ERPNext + Next.js experiences."}
          </p>
          <a
            href={`mailto:${ws?.contact_email || "care@adimyra.com"}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {ws?.contact_email || "care@adimyra.com"}
          </a>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>
            ©{" "}
            {ws?.copyright
              ? ws.copyright
              : `${year} ${ws?.app_name || "__SPA__"}. All rights reserved.`}
          </p>
          <p>
            Powered by{" "}
            <a
              href="mailto:care@adimyra.com"
              className="font-medium text-primary hover:underline"
            >
              {ws?.footer_powered || "Adimyra Systems Private Limited"}
            </a>{" "}
            · ERPNext + Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
