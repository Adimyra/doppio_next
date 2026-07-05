"use client";

import {
  useFrappeEventListener,
  useFrappeGetDocList,
} from "frappe-react-sdk";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface ErrorLog {
  name: string;
  method?: string;
  error?: string;
  seen?: 0 | 1;
  creation: string;
}

export default function AdminLogsPage() {
  const {
    data: logs,
    isLoading,
    error,
    mutate,
  } = useFrappeGetDocList<ErrorLog>("Error Log", {
    fields: ["name", "method", "error", "seen", "creation"],
    orderBy: { field: "creation", order: "desc" },
    limit: 25,
  });

  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "Error Log") {
      mutate();
    }
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Error Logs</h1>
        <p className="text-sm text-muted-foreground">
          The 25 most recent server errors. Open the Desk for full tracebacks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent errors</CardTitle>
          <CardDescription>Updates in realtime.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {error ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Could not load Error Logs.
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
                  <TableHead>Method</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Seen</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs ?? []).map((log) => (
                  <TableRow key={log.name}>
                    <TableCell className="max-w-64 truncate font-mono text-xs">
                      {log.method ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-96 truncate text-xs text-muted-foreground">
                      {(log.error ?? "").split("\n").pop() || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.seen ? "secondary" : "destructive"}>
                        {log.seen ? "Seen" : "New"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.creation.slice(0, 19).replace("T", " ")}
                    </TableCell>
                  </TableRow>
                ))}
                {(logs ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No errors — nice.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
