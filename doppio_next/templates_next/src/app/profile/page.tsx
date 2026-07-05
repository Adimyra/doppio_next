"use client";

import { useEffect, useState } from "react";
import {
  useFrappeGetDoc,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { toast } from "sonner";

import { AppHeader, useRequireAuth } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDoc {
  name: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user_image?: string;
  phone?: string;
  mobile_no?: string;
  location?: string;
  bio?: string;
  user_type?: string;
  enabled?: 0 | 1;
  last_active?: string;
}

export default function ProfilePage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth();

  const {
    data: user,
    isLoading,
    mutate,
  } = useFrappeGetDoc<UserDoc>(
    "User",
    currentUser ?? undefined,
    currentUser ? undefined : null // don't fetch until we know the user
  );

  const { updateDoc, loading: saving } = useFrappeUpdateDoc();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setPhone(user.mobile_no ?? user.phone ?? "");
      setLocation(user.location ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc("User", user.name, {
        first_name: firstName,
        last_name: lastName,
        mobile_no: phone,
        location,
        bio,
      });
      toast.success("Profile updated");
      mutate();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Update failed"
      );
    }
  }

  const loading = authLoading || isLoading;

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Your account" />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {loading ? (
                <Skeleton className="size-16 rounded-full" />
              ) : (
                <Avatar className="size-16">
                  {user?.user_image ? (
                    <AvatarImage src={user.user_image} alt="" />
                  ) : null}
                  <AvatarFallback className="text-xl">
                    {(user?.full_name ?? user?.name ?? "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="space-y-1">
                {loading ? (
                  <>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-xl">
                      {user?.full_name ?? user?.name}
                    </CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="secondary">
                        {user?.user_type ?? "User"}
                      </Badge>
                      <Badge variant={user?.enabled ? "default" : "outline"}>
                        {user?.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              Changes are saved to your User document in Frappe.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={onSave} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Mobile</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Button type="submit" disabled={loading || saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
