"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ArrowRight, FileText, Search, SearchX } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface WebSearchResult {
  doctype: string;
  name: string;
  title?: string;
  route?: string;
  content?: string;
}

/** SPA pages offered as quick matches alongside site-wide results. */
const PAGES = [
  { title: "Home", route: "/", keywords: "home landing start" },
  { title: "About us", route: "/about", keywords: "about company team history" },
  { title: "Contact us", route: "/contact", keywords: "contact email phone address support enquiry" },
  { title: "Blog", route: "/blog", keywords: "blog news articles posts" },
  { title: "My Account", route: "/my-account", keywords: "account profile orders invoices issues" },
  { title: "Login / Sign up", route: "/login", keywords: "login sign in signup register password" },
];

function snippet(content?: string): string {
  if (!content) return "";
  return content
    .replace(/\|\|\|/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 180);
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState<string | null>(null);

  // ?q= from the navbar search (static export: read on mount)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(q);
    setTerm(q.trim() || null);
  }, []);

  const { data, isLoading } = useFrappeGetCall<{
    message: WebSearchResult[];
  }>(
    "frappe.utils.global_search.web_search",
    { text: term ?? "" },
    term ? `web-search-${term}` : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const results = (data?.message ?? []).filter((r) => r.route || r.title);

  const lowered = (term ?? "").toLowerCase();
  const pageMatches = lowered
    ? PAGES.filter(
        (page) =>
          page.title.toLowerCase().includes(lowered) ||
          page.keywords.includes(lowered)
      )
    : [];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.replace(`/search?q=${encodeURIComponent(q)}`);
    setTerm(q);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <FadeIn>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <form onSubmit={onSubmit} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this site..."
                className="h-11 pl-9"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        </FadeIn>

        <div className="mt-8 grid gap-3">
          {/* Quick page matches */}
          {pageMatches.length ? (
            <>
              <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                Pages
              </p>
              {pageMatches.map((page) => (
                <Link key={page.route} href={page.route}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader className="flex-row items-center justify-between py-4">
                      <CardTitle className="text-base">{page.title}</CardTitle>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </>
          ) : null}

          {/* Site-wide results */}
          {term && isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-2/3" />
            </div>
          ) : null}

          {term && !isLoading && results.length ? (
            <>
              <p className="mt-2 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                Results for “{term}”
              </p>
              {results.map((result) => {
                const isBlog = result.doctype === "Blog Post";
                const href = isBlog
                  ? `/blog/post?name=${encodeURIComponent(result.name)}`
                  : `/${result.route ?? ""}`;
                const card = (
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader className="py-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-4 shrink-0 text-primary" />
                        {result.title || result.name}
                      </CardTitle>
                      {snippet(result.content) ? (
                        <CardDescription className="line-clamp-2">
                          {snippet(result.content)}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                  </Card>
                );
                return isBlog ? (
                  <Link key={`${result.doctype}-${result.name}`} href={href}>
                    {card}
                  </Link>
                ) : (
                  // non-SPA routes are served by Frappe at the site root
                  <a key={`${result.doctype}-${result.name}`} href={href}>
                    {card}
                  </a>
                );
              })}
            </>
          ) : null}

          {/* Empty state */}
          {term && !isLoading && !results.length && !pageMatches.length ? (
            <FadeIn>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
                  <SearchX className="size-6 text-primary" />
                </span>
                <p className="text-lg font-semibold">
                  No results for “{term}”
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try a different keyword, or reach out — we&apos;re happy to
                  help you find what you need.
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </FadeIn>
          ) : null}

          {!term ? (
            <p className="text-sm text-muted-foreground">
              Type a keyword above to search pages, blog posts and published
              content.
            </p>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
