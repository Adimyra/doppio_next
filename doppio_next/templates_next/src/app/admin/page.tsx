"use client";

import {
  useFrappeEventListener,
  useFrappeGetDocCount,
  useFrappeGetDocList,
} from "frappe-react-sdk";

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

interface ActivityLog {
  name: string;
  subject?: string;
  user?: string;
  status?: string;
  creation: string;
}

export default function AdminOverviewPage() {
  const { data: userCount, isLoading: loadingUsers } =
    useFrappeGetDocCount("User");
  const { data: roleCount, isLoading: loadingRoles } =
    useFrappeGetDocCount("Role");
  const { data: errorCount, isLoading: loadingErrors } =
    useFrappeGetDocCount("Error Log");

  const {
    data: activity,
    isLoading: loadingActivity,
    error: activityError,
    mutate,
  } = useFrappeGetDocList<ActivityLog>("Activity Log", {
    fields: ["name", "subject", "user", "status", "creation"],
    orderBy: { field: "creation", order: "desc" },
    limit: 10,
  });

  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "Activity Log") {
      mutate();
    }
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Site administration at a glance.
        </p>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatCard title="Users" value={userCount} loading={loadingUsers} />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Roles" value={roleCount} loading={loadingRoles} />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Error Logs"
            value={errorCount}
            loading={loadingErrors}
          />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Latest entries from the Activity Log (updates in realtime).
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {activityError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Could not load the Activity Log.
            </p>
          ) : loadingActivity ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activity ?? []).map((log) => (
                  <TableRow key={log.name}>
                    <TableCell className="max-w-96 truncate">
                      {log.subject ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.user ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "Success" ? "secondary" : "outline"
                        }
                      >
                        {log.status ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.creation.slice(0, 19).replace("T", " ")}
                    </TableCell>
                  </TableRow>
                ))}
                {(activity ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No activity yet.
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
