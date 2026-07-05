"use client";

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
 * Project monitoring — reads the ERPNext `Project` doctype.
 * If ERPNext is not installed on the site, a hint is shown instead.
 */
interface Project {
  name: string;
  project_name?: string;
  status?: string;
  priority?: string;
  percent_complete?: number;
  expected_end_date?: string;
  modified: string;
}

function statusVariant(status?: string) {
  if (status === "Open") return "default" as const;
  if (status === "Completed") return "secondary" as const;
  return "outline" as const;
}

function isOverdue(p: Project) {
  return (
    p.status === "Open" &&
    !!p.expected_end_date &&
    new Date(p.expected_end_date) < new Date()
  );
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export default function ProjectsPage() {
  useRequireAuth();

  const {
    data: projects,
    isLoading,
    error,
    mutate,
  } = useFrappeGetDocList<Project>("Project", {
    fields: [
      "name",
      "project_name",
      "status",
      "priority",
      "percent_complete",
      "expected_end_date",
      "modified",
    ],
    orderBy: { field: "modified", order: "desc" },
    limit: 50,
  });

  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "Project") {
      mutate();
    }
  });

  const all = projects ?? [];
  const open = all.filter((p) => p.status === "Open");
  const completed = all.filter((p) => p.status === "Completed");
  const overdue = all.filter(isOverdue);

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Project monitoring" />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <StaggerContainer className="grid gap-4 sm:grid-cols-4">
          {(
            [
              ["Total", all.length],
              ["Open", open.length],
              ["Completed", completed.length],
              ["Overdue", overdue.length],
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
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Live from the ERPNext Project doctype (updates in realtime).
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Could not load the Project doctype. Is ERPNext installed on
                this site, and does your user have read access to Projects?
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
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">
                        {p.project_name ?? p.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={statusVariant(p.status)}>
                            {p.status ?? "-"}
                          </Badge>
                          {isOverdue(p) && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.priority ?? "-"}
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={p.percent_complete ?? 0} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {p.expected_end_date ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {all.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No projects found.
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
