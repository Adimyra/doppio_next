"use client";

import Link from "next/link";
import { useFrappeGetDocList } from "frappe-react-sdk";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Blog list — reads Frappe's built-in `Blog Post` doctype.
 *
 * Guest REST access to Blog Post is not enabled by default; if the list
 * fails for guests, either log in, or allow guest read via a whitelisted
 * method / role permission on your site.
 *
 * Post detail links use a query param (/blog/post?name=...), which is
 * static-export-safe — no generateStaticParams needed for new posts.
 */
interface BlogPost {
  name: string;
  title: string;
  blog_intro?: string;
  blogger?: string;
  blog_category?: string;
  published_on?: string;
}

export default function BlogPage() {
  const {
    data: posts,
    isLoading,
    error,
  } = useFrappeGetDocList<BlogPost>("Blog Post", {
    fields: [
      "name",
      "title",
      "blog_intro",
      "blogger",
      "blog_category",
      "published_on",
    ],
    filters: [["published", "=", 1]],
    orderBy: { field: "published_on", order: "desc" },
    limit: 20,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">
            News and updates, published from the Frappe Desk (Blog Post
            doctype).
          </p>
        </div>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Could not load blog posts
              </CardTitle>
              <CardDescription>
                Guests cannot read Blog Post over REST by default. Log in, or
                grant guest read access on your site to make the blog public.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {(posts ?? []).map((post) => (
              <Link
                key={post.name}
                href={`/blog/post?name=${encodeURIComponent(post.name)}`}
                className="group block"
              >
                <Card className="transition-colors group-hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {post.blog_category ? (
                        <Badge variant="secondary">{post.blog_category}</Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {post.published_on ?? ""}
                      </span>
                    </div>
                    <CardTitle className="text-lg group-hover:underline">
                      {post.title}
                    </CardTitle>
                    {post.blog_intro ? (
                      <CardDescription>{post.blog_intro}</CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {(posts ?? []).length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No posts yet</CardTitle>
                  <CardDescription>
                    Create a published Blog Post in the Desk to see it here.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
