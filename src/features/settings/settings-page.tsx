"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/feedback";
import { FormField, Input, TextArea } from "@/components/ui/fields";
import { REGION_SUGGESTIONS } from "@/lib/constants";
import { api } from "@/lib/api";
import type { UserProfile } from "@/types";

export function SettingsPage() {
  const client = useQueryClient();
  const { theme, setTheme } = useTheme();
  const profile = useQuery({ queryKey: ["me"], queryFn: () => api<UserProfile>("/api/auth/me") });
  const [form, setForm] = useState({ name: "", title: "", currentGoal: "", location: "", targetRegions: [] as string[], careerStatement: "" });
  const [loadedProfile, setLoadedProfile] = useState(profile.data);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [confirmDemo, setConfirmDemo] = useState(false);

  if (profile.data && profile.data !== loadedProfile) {
    setLoadedProfile(profile.data);
    setForm({
      name: profile.data.name,
      title: profile.data.title,
      currentGoal: profile.data.currentGoal,
      location: profile.data.location,
      targetRegions: profile.data.targetRegions,
      careerStatement: profile.data.careerStatement,
    });
  }

  const save = useMutation({
    mutationFn: () => api("/api/profile", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: async () => {
      toast.success("Profile saved");
      await client.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePassword = useMutation({
    mutationFn: () => api("/api/auth/password", { method: "POST", body: JSON.stringify(passwords) }),
    onSuccess: () => {
      toast.success("Password updated");
      setPasswords({ currentPassword: "", newPassword: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeDemo = useMutation({
    mutationFn: () => api("/api/settings/demo", { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Example data removed");
      setConfirmDemo(false);
      await client.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (profile.isLoading) return <Skeleton className="h-64" />;
  if (profile.isError || !profile.data) return <ErrorState message="Settings could not be loaded." onRetry={() => profile.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Profile, theme, and account. Nothing else." />
      <form className="space-y-4 rounded-lg border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" htmlFor="name"><Input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
          <FormField label="Professional title" htmlFor="title"><Input id="title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField>
          <FormField label="Location" htmlFor="location"><Input id="location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></FormField>
          <FormField label="Current goal" htmlFor="goal"><Input id="goal" value={form.currentGoal} onChange={(event) => setForm({ ...form, currentGoal: event.target.value })} /></FormField>
        </div>
        <FormField label="Target regions"><TagInput value={form.targetRegions} onChange={(targetRegions) => setForm({ ...form, targetRegions })} suggestions={REGION_SUGGESTIONS} placeholder="Add a region" /></FormField>
        <FormField label="Short career statement" htmlFor="statement"><TextArea id="statement" value={form.careerStatement} onChange={(event) => setForm({ ...form, careerStatement: event.target.value })} /></FormField>
        <Button type="submit" loading={save.isPending} loadingLabel="Saving…">Save profile</Button>
      </form>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Theme</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
          {(["light", "dark", "system"] as const).map((value) => (
            <Button key={value} type="button" variant={theme === value ? "default" : "secondary"} onClick={() => setTheme(value)} aria-checked={theme === value} role="radio">
              {value === "system" ? "System" : value === "dark" ? "Dark" : "Light"}
            </Button>
          ))}
        </div>
      </section>

      <form className="space-y-4 rounded-lg border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); changePassword.mutate(); }}>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">{profile.data.email}</p>
        <FormField label="Current password" htmlFor="current"><Input id="current" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /></FormField>
        <FormField label="New password" htmlFor="next" hint="At least 8 characters."><Input id="next" type="password" autoComplete="new-password" minLength={8} value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required /></FormField>
        <Button type="submit" loading={changePassword.isPending} loadingLabel="Updating…">Update password</Button>
      </form>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Example data</h2>
        <p className="mt-2 text-sm text-muted-foreground">Seeded examples are marked separately from records you create. Removing them leaves your account, criteria, and career direction in place.</p>
        <Button type="button" className="mt-4" variant="secondary" onClick={() => setConfirmDemo(true)}>Remove example data</Button>
      </section>

      <ConfirmDialog open={confirmDemo} title="Remove example data?" description="Demo companies, people, applications, interviews, notes, and actions will be deleted. Your own records stay." confirmLabel="Remove" loading={removeDemo.isPending} onOpenChange={setConfirmDemo} onConfirm={() => removeDemo.mutate()} />
    </div>
  );
}
