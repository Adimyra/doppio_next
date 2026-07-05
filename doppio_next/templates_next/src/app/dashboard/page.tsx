"use client";

import {
  useFrappeEventListener,
  useFrappeGetDocCount,
  useFrappeGetDocList,
} from "frappe-react-sdk";

import { AppHeader, useRequireAuth } from "@/components/app-header";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
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

interface ToDo {
  name: string;
  description?: string;
  status?: string;
  modified: string;
}

function statusVariant(status?: string) {
  if (status === "Open") return "default" as const;
  if (status === "Closed") return "secondary" as const;
  return "outline" as const;
}

export default function DashboardPage() {
  useRequireAuth();

  const { data: todoCount, isLoading: loadingTodos } =
    useFrappeGetDocCount("ToDo");
  const { data: userCount, isLoading: loadingUsers } =
    useFrappeGetDocCount("User");
  const { data: fileCount, isLoading: loadingFiles } =
    useFrappeGetDocCount("File");

  const {
    data: todos,
    isLoading: loadingList,
    mutate,
  } = useFrappeGetDocList<ToDo>("ToDo", {
    fields: ["name", "description", "status", "modified"],
    orderBy: { field: "modified", order: "desc" },
    limit: 10,
  });

  // Realtime: refresh the list when ToDos change on the server
  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "ToDo") {
      mutate();
    }
  });

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Live data from your Frappe site" />

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <StaggerContainer className="grid gap-4 sm:grid-cols-3">
          <StaggerItem>
            <StatCard title="ToDos" value={todoCount} loading={loadingTodos} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Users" value={userCount} loading={loadingUsers} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Files" value={fileCount} loading={loadingFiles} />
          </StaggerItem>
        </StaggerContainer>

        <Card>
          <CardHeader>
            <CardTitle>Recent ToDos</CardTitle>
            <CardDescription>
              Ten most recently modified ToDo documents (updates in realtime).
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {loadingList ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(todos ?? []).map((todo) => (
                    <TableRow key={todo.name}>
                      <TableCell className="font-mono text-xs">
                        {todo.name}
                      </TableCell>
                      <TableCell
                        className="max-w-96 truncate"
                        // ToDo descriptions are HTML in Frappe
                        dangerouslySetInnerHTML={{
                          __html: todo.description ?? "",
                        }}
                      />
                      <TableCell>
                        <Badge variant={statusVariant(todo.status)}>
                          {todo.status ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {todo.modified}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(todos ?? []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No ToDos yet — create one in the Desk to see it here.
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
