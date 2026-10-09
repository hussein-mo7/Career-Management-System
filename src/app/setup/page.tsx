"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/fields";
import { api } from "@/lib/api";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/setup", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="This is a single personal account. You only do this once."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </FormField>
        <FormField label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required />
        </FormField>
        <Button type="submit" className="w-full" loading={loading} loadingLabel="Creating account…">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already set up?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
