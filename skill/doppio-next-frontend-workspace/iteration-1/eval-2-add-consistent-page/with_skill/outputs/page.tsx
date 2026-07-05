"use client";

import { useMemo, useState } from "react";
import {
  useFrappeEventListener,
  useFrappeGetDocList,
} from "frappe-react-sdk";

import { AppHeader, useRequireAuth } from "@/components/app-header";
import {
  AnimatedNumber,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

/**
 * Supplier directory — reads the ERPNext `Supplier` doctype.
 * If ERPNext is not installed on the site, a hint is shown instead.
 */
interface Supplier {
  name: string;
  supplier_name?: string;
  supplier_group?: string;
  supplier_type?: string;
  country?: string;
  disabled?: 0 | 1;
  on_hold?: 0 | 1;
  modified: string;
}

/** Supplier has no single status field — derive one from disabled/on_hold. */
function supplierStatus(s: Supplier) {
  if (s.disabled) return "Disabled" as const;
  if (s.on_hold) return "On Hold" as const;
  return "Active" as const;
}

function statusVariant(status: ReturnType<typeof supplierStatus>) {
  if (status === "Active") return "default" as const;
  if (status === "On Hold") return "outline" as const;
  return "destructive" as const;
}

export default function SuppliersPage() {
  useRequireAuth();

  const [query, setQuery] = useState("");

  const {
    data: suppliers,
    isLoading,
    error,
    mutate,
  } = useFrappeGetDocList<Supplier>("Supplier", {
    fields: [
      "name",
      "supplier_name",
      "supplier_group",
      "supplier_type",
      "country",
      "disabled",
      "on_hold",
      "modified",
    ],
    orderBy: { field: "modified", order: "desc" },
    limit: 100,
  });

  // Realtime: refresh the list when Suppliers change on the server
  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "Supplier") {
      mutate();
    }
  });

  const all = suppliers ?? [];
  const active = all.filter((s) => supplierStatus(s) === "Active");
  const onHold = all.filter((s) => supplierStatus(s) === "On Hold");
  const disabled = all.filter((s) => supplierStatus(s) === "Disabled");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.supplier_name ?? "").toLowerCase().includes(q) ||
        (s.supplier_group ?? "").toLowerCase().includes(q)
    );
  }, [all, query]);

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Supplier directory" />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <StaggerContainer className="grid gap-4 sm:grid-cols-4">
          {(
            [
              ["Total", all.length],
              ["Active", active.length],
              ["On hold", onHold.length],
              ["Disabled", disabled.length],
            ] as const
          ).map(([title, value]) => (
            <StaggerItem key={title}>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{title}</CardDescription>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <CardTitle className="text-3xl">
                      <AnimatedNumber value={value} />
                    </CardTitle>
                  )}
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Live from the ERPNext Supplier doctype (updates in realtime,
              showing the 100 most recently modified).
            </CardDescription>
            <Input
              placeholder="Search by name or group..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
              aria-label="Search suppliers"
            />
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Could not load the Supplier doctype. Is ERPNext installed on
                this site, and does your user have read access to Suppliers?
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const status = supplierStatus(s);
                    return (
                      <TableRow key={s.name}>
                        <TableCell>
                          <div className="font-medium">
                            {s.supplier_name ?? s.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.country ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.supplier_group ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {s.supplier_type ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(status)}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {s.modified.slice(0, 10)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        {query
                          ? "No suppliers match your search."
                          : "No suppliers found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
