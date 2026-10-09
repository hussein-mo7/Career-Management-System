"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/fields";
import { api } from "@/lib/api";
import { loginSchema } from "@/schemas";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const status = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api<{ needsSetup: boolean }>("/api/auth/status"),
  });
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Log in"
      description="This workspace is private. Use the account you created for Hussein Career OS."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        </FormField>
        <Button type="submit" className="w-full" loading={loading} loadingLabel="Signing in…">
          Log in
        </Button>
      </form>
      {status.data?.needsSetup ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No account yet.{" "}
          <Link href="/setup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create the first account
          </Link>
        </p>
      ) : null}
    </AuthCard>
  );
}
