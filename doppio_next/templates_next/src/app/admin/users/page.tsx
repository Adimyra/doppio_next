"use client";

import { useMemo, useState } from "react";
import {
  useFrappeEventListener,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface UserRow {
  name: string;
  full_name?: string;
  email?: string;
  user_type?: string;
  enabled?: 0 | 1;
  last_active?: string;
}

const PROTECTED_USERS = new Set(["Administrator", "Guest"]);

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");

  const {
    data: users,
    isLoading,
    error,
    mutate,
  } = useFrappeGetDocList<UserRow>("User", {
    fields: [
      "name",
      "full_name",
      "email",
      "user_type",
      "enabled",
      "last_active",
    ],
    orderBy: { field: "modified", order: "desc" },
    limit: 100,
  });

  useFrappeEventListener("list_update", (data) => {
    if (data?.doctype === "User") {
      mutate();
    }
  });

  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const [busyUser, setBusyUser] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  async function toggleEnabled(user: UserRow) {
    setBusyUser(user.name);
    try {
      await updateDoc("User", user.name, {
        enabled: user.enabled ? 0 : 1,
      });
      toast.success(
        `${user.full_name ?? user.name} ${user.enabled ? "disabled" : "enabled"}`
      );
      mutate();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Update failed"
      );
    } finally {
      setBusyUser(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Enable or disable accounts. Role changes belong in the Desk.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>All users</CardTitle>
          <CardDescription>
            {users?.length ?? 0} accounts (showing the 100 most recently
            modified).
          </CardDescription>
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
            aria-label="Search users"
          />
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {error ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Could not load users.
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
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const isProtected = PROTECTED_USERS.has(user.name);
                  return (
                    <TableRow key={user.name}>
                      <TableCell>
                        <div className="font-medium">
                          {user.full_name ?? user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email ?? user.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.user_type ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.enabled ? "default" : "destructive"}>
                          {user.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.last_active
                          ? user.last_active.slice(0, 10)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            isProtected || (updating && busyUser === user.name)
                          }
                          onClick={() => toggleEnabled(user)}
                        >
                          {busyUser === user.name
                            ? "Saving..."
                            : user.enabled
                              ? "Disable"
                              : "Enable"}
                        </Button>
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
                      No users match your search.
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
