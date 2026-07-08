"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  brandImage,
  resolveItemUrl,
  useWebsiteSettings,
  type TopBarItem,
} from "@/lib/website-settings";

/** Fallback nav used until Website Settings load (or when empty). */
const DEFAULT_NAV: TopBarItem[] = [
  { label: "Home", url: "/" },
  { label: "About", url: "/about" },
  { label: "Blog", url: "/blog" },
];

function NavLink({ item, active }: { item: TopBarItem; active: boolean }) {
  const { href, external } = resolveItemUrl(item.url);
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(active && "bg-accent text-accent-foreground")}
    >
      {external ? (
        <a
          href={href}
          target={item.open_in_new_tab ? "_blank" : undefined}
          rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
        >
          {item.label}
        </a>
      ) : (
        <Link href={href}>{item.label}</Link>
      )}
    </Button>
  );
}

function NavDropdown({
  item,
  childItems,
}: {
  item: TopBarItem;
  childItems: TopBarItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {item.label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {childItems.map((child) => {
          const { href, external } = resolveItemUrl(child.url);
          return (
            <DropdownMenuItem key={child.label} asChild>
              {external ? (
                <a
                  href={href}
                  target={child.open_in_new_tab ? "_blank" : undefined}
                  rel={
                    child.open_in_new_tab ? "noopener noreferrer" : undefined
                  }
                >
                  {child.label}
                </a>
              ) : (
                <Link href={href}>{child.label}</Link>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavbarSearch() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (typeof q === "string" && q.trim()) {
      // Frappe's site-wide search page (outside the SPA basePath)
      window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden sm:block">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        placeholder="Search..."
        className="h-8 w-44 pl-8 text-sm"
      />
    </form>
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
  const loggedOut = !isLoading && !currentUser;

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={ws?.app_name || "__SPA__"} className="h-7" />
          ) : (
            <span className="text-lg font-semibold">
              {ws?.app_name || "__SPA__"}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-1">
          {topLevel.map((item) => {
            const kids = childrenOf(item.label);
            return kids.length ? (
              <NavDropdown key={item.label} item={item} childItems={kids} />
            ) : (
              <NavLink
                key={item.label}
                item={item}
                active={pathname === resolveItemUrl(item.url).href}
              />
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {ws?.navbar_search ? <NavbarSearch /> : null}
        {loggedOut && !ws?.hide_login ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        ) : null}
        {loggedOut && ws && !ws.disable_signup && !ws.hide_login ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/login#signup">Sign up</Link>
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
  const ws = useWebsiteSettings();
  const footerItems = ws?.footer_items ?? [];

  return (
    <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
      {footerItems.length ? (
        <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {footerItems.map((item) => {
            const { href, external } = resolveItemUrl(item.url);
            return external ? (
              <a
                key={item.label}
                href={href}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
      {ws?.address ? (
        <div
          className="mb-3 [&_a]:underline"
          // Website Settings "Address" is sanitized rich text from the site
          dangerouslySetInnerHTML={{ __html: ws.address }}
        />
      ) : null}
      <p>
        {ws?.copyright
          ? `© ${ws.copyright}`
          : "__SPA__ — built on Frappe with Next.js, Tailwind CSS v4 and shadcn/ui."}
      </p>
    </footer>
  );
}
