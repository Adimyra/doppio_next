"use client";

import { AnimatedNumber } from "@/components/motion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared metric card — used by the dashboard and admin overview. */
export function StatCard({
  title,
  value,
  loading = false,
}: {
  title: string;
  value?: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <CardTitle className="text-3xl">
            <AnimatedNumber value={value ?? 0} />
          </CardTitle>
        )}
      </CardHeader>
    </Card>
  );
}
