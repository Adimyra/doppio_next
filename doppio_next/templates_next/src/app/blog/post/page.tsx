"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Blog post detail, addressed by query param: /blog/post?name=<docname>.
 * Query params (instead of /blog/[slug]) keep this fully static-export
 * compatible — new posts need no rebuild. useSearchParams requires a
 * Suspense boundary, hence the split below.
 */
interface BlogPostDoc {
  name: string;
  title: string;
  content?: string;
  content_html?: string;
  blogger?: string;
  blog_category?: string;
  published_on?: string;
  read_time?: number;
}

function PostBody() {
  const params = useSearchParams();
  const name = params.get("name");

  const {
    data: post,
    isLoading,
    error,
  } = useFrappeGetDoc<BlogPostDoc>(
    "Blog Post",
    name ?? undefined,
    name ? undefined : null
  );

  if (!name) {
    return (
      <p className="text-muted-foreground">
        No post selected.{" "}
        <Link href="/blog" className="underline underline-offset-4">
          Back to the blog
        </Link>
        .
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-muted-foreground">
        Could not load this post — it may be unpublished, or guests may not
        have read access.
      </p>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const html = post.content_html || post.content || "";

  return (
    <article className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {post.blog_category ? (
            <Badge variant="secondary">{post.blog_category}</Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {post.published_on ?? ""}
            {post.blogger ? ` · ${post.blogger}` : ""}
            {post.read_time ? ` · ${post.read_time} min read` : ""}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
      </div>

      <Separator />

      <div
        className="prose prose-neutral max-w-none dark:prose-invert [&_img]:rounded-lg"
        // Blog Post content is authored HTML/Markdown-rendered in Frappe
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">← All posts</Link>
        </Button>
      </div>
    </article>
  );
}

export default function BlogPostPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Suspense
          fallback={<Skeleton className="h-64 w-full" />}
        >
          <PostBody />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
