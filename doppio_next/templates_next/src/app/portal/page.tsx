"use client";

import { useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk";

import { AppHeader, useRequireAuth } from "@/components/app-header";
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

/**
 * Portal — "my stuff" view for the logged-in user:
 * support Issues they raised (ERPNext/Helpdesk) and their open ToDos.
 * Sections degrade gracefully when a doctype is unavailable.
 */
interface Issue {
  name: string;
  subject?: string;
  status?: string;
  priority?: string;
  creation: string;
}

interface ToDo {
  name: string;
  description?: string;
  status?: string;
  date?: string;
  reference_type?: string;
  reference_name?: string;
}

function issueVariant(status?: string) {
  if (status === "Open") return "default" as const;
  if (status === "Closed" || status === "Resolved")
    return "secondary" as const;
  return "outline" as const;
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center text-muted-foreground"
      >
        {text}
      </TableCell>
    </TableRow>
  );
}

export default function PortalPage() {
  useRequireAuth();
  const { currentUser } = useFrappeAuth();

  const {
    data: issues,
    isLoading: loadingIssues,
    error: issuesError,
  } = useFrappeGetDocList<Issue>(
    "Issue",
    {
      fields: ["name", "subject", "status", "priority", "creation"],
      filters: [["raised_by", "=", currentUser ?? ""]],
      orderBy: { field: "creation", order: "desc" },
      limit: 10,
    },
    currentUser ? undefined : null // don't fetch until we know the user
  );

  const {
    data: todos,
    isLoading: loadingTodos,
    error: todosError,
  } = useFrappeGetDocList<ToDo>(
    "ToDo",
    {
      fields: [
        "name",
        "description",
        "status",
        "date",
        "reference_type",
        "reference_name",
      ],
      filters: [
        ["allocated_to", "=", currentUser ?? ""],
        ["status", "=", "Open"],
      ],
      orderBy: { field: "modified", order: "desc" },
      limit: 10,
    },
    currentUser ? undefined : null
  );

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Your portal" />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome{currentUser ? `, ${currentUser}` : ""}</CardTitle>
            <CardDescription>
              Everything assigned to or raised by you, in one place.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My support issues</CardTitle>
            <CardDescription>
              Issues you raised (ERPNext / Helpdesk `Issue` doctype).
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {issuesError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                The Issue doctype is not available on this site (requires
                ERPNext or Helpdesk) or you lack read access.
              </p>
            ) : loadingIssues ? (
              <SectionSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(issues ?? []).map((issue) => (
                    <TableRow key={issue.name}>
                      <TableCell className="font-mono text-xs">
                        {issue.name}
                      </TableCell>
                      <TableCell className="max-w-96 truncate">
                        {issue.subject ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={issueVariant(issue.status)}>
                          {issue.status ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {issue.creation.slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(issues ?? []).length === 0 && (
                    <EmptyRow colSpan={4} text="No issues raised by you." />
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My open ToDos</CardTitle>
            <CardDescription>
              Open ToDo documents allocated to you.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {todosError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Could not load your ToDos.
              </p>
            ) : loadingTodos ? (
              <SectionSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Linked to</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(todos ?? []).map((todo) => (
                    <TableRow key={todo.name}>
                      <TableCell
                        className="max-w-96 truncate"
                        dangerouslySetInnerHTML={{
                          __html: todo.description ?? "",
                        }}
                      />
                      <TableCell className="text-sm text-muted-foreground">
                        {todo.reference_type
                          ? `${todo.reference_type}: ${todo.reference_name}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {todo.date ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(todos ?? []).length === 0 && (
                    <EmptyRow colSpan={3} text="Nothing allocated to you." />
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
