"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/controls";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  REGION_SUGGESTIONS,
  REMOTE_LABELS,
  REMOTE_PREFERENCES,
  SKILL_GROUP_LABELS,
  SKILL_GROUPS,
  SKILL_STATUS_LABELS,
  SKILL_STATUSES,
} from "@/lib/constants";
import { api } from "@/lib/api";
import type { CareerProfile, Skill, SkillGroup, SkillStatus } from "@/types";

export function CareerPage() {
  const client = useQueryClient();
  const career = useQuery({ queryKey: ["career"], queryFn: () => api<CareerProfile>("/api/career") });
  const [form, setForm] = useState<CareerProfile | null>(null);
  const [loadedCareer, setLoadedCareer] = useState(career.data);
  const [skillName, setSkillName] = useState("");
  const [skillGroup, setSkillGroup] = useState<SkillGroup>("technical");

  if (career.data !== loadedCareer) {
    setLoadedCareer(career.data);
    setForm(career.data ?? null);
  }

  useEffect(() => {
    if (!form || !career.data) return;
    const dirty = JSON.stringify(form) !== JSON.stringify(career.data);
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [form, career.data]);

  const save = useMutation({
    mutationFn: (value: CareerProfile) =>
      api<CareerProfile>("/api/career", {
        method: "PUT",
        body: JSON.stringify({
          vision: value.vision,
          longTermTarget: value.longTermTarget,
          currentTargetRole: value.currentTargetRole,
          preferredRoles: value.preferredRoles,
          preferredCompanySize: value.preferredCompanySize,
          preferredWorkEnvironment: value.preferredWorkEnvironment,
          preferredRegions: value.preferredRegions,
          remotePreference: value.remotePreference,
          searchFocus: value.searchFocus,
          skills: value.skills,
        }),
      }),
    onSuccess: async (data) => {
      toast.success("Career direction saved");
      setForm(data);
      await client.invalidateQueries({ queryKey: ["career"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (career.isLoading || !form) return <Skeleton className="h-80" />;
  if (career.isError) return <ErrorState message="Career direction could not be loaded." onRetry={() => career.refetch()} />;

  function updateSkill(index: number, status: SkillStatus) {
    setForm((current) => {
      if (!current) return current;
      const skills = current.skills.map((skill, skillIndex) => (skillIndex === index ? { ...skill, status } : skill));
      return { ...current, skills };
    });
  }

  function addSkill() {
    const name = skillName.trim();
    if (!name || !form) return;
    if (form.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase() && skill.group === skillGroup)) {
      toast.error("That skill is already listed");
      return;
    }
    const skill: Skill = { name, group: skillGroup, status: "not_started" };
    setForm({ ...form, skills: [...form.skills, skill] });
    setSkillName("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(form);
      }}
      className="space-y-8"
    >
      <PageHeader
        title="Career"
        description="The direction you are building toward, and the skills that get you there."
        action={
          <Button type="submit" loading={save.isPending} loadingLabel="Saving…">
            Save career
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">4-year vision</h2>
        <div className="mt-4 grid gap-4">
          <FormField label="Short vision" htmlFor="longTerm">
            <Input id="longTerm" value={form.longTermTarget} onChange={(event) => setForm({ ...form, longTermTarget: event.target.value })} />
          </FormField>
          <FormField label="Full vision" htmlFor="vision">
            <TextArea id="vision" value={form.vision} onChange={(event) => setForm({ ...form, vision: event.target.value })} />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Current direction</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Current target role" htmlFor="target">
            <Input id="target" value={form.currentTargetRole} onChange={(event) => setForm({ ...form, currentTargetRole: event.target.value })} />
          </FormField>
          <FormField label="Remote preference" htmlFor="remote">
            <Select id="remote" value={form.remotePreference} onChange={(event) => setForm({ ...form, remotePreference: event.target.value as CareerProfile["remotePreference"] })}>
              {REMOTE_PREFERENCES.map((value) => (
                <option key={value} value={value}>
                  {REMOTE_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Preferred company size" htmlFor="size">
            <Input id="size" value={form.preferredCompanySize} onChange={(event) => setForm({ ...form, preferredCompanySize: event.target.value })} />
          </FormField>
          <FormField label="Search focus" htmlFor="focus">
            <Input id="focus" value={form.searchFocus} onChange={(event) => setForm({ ...form, searchFocus: event.target.value })} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Preferred work environment" htmlFor="environment">
              <TextArea id="environment" value={form.preferredWorkEnvironment} onChange={(event) => setForm({ ...form, preferredWorkEnvironment: event.target.value })} />
            </FormField>
          </div>
          <div>
            <FormField label="Preferred roles" hint="Type a role and press Enter.">
              <TagInput value={form.preferredRoles} onChange={(preferredRoles) => setForm({ ...form, preferredRoles })} placeholder="Full-Stack Developer" />
            </FormField>
          </div>
          <div>
            <FormField label="Preferred regions" hint="These stay editable as priorities change.">
              <TagInput value={form.preferredRegions} onChange={(preferredRegions) => setForm({ ...form, preferredRegions })} suggestions={REGION_SUGGESTIONS} placeholder="Add a region" />
            </FormField>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold">Skills to develop</h2>
            <p className="text-sm text-muted-foreground">A simple status is enough. This is not a skill-management platform.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="Add a skill" aria-label="New skill" className="w-48" />
            <Select value={skillGroup} onChange={(event) => setSkillGroup(event.target.value as SkillGroup)} aria-label="Skill group" className="w-40">
              {SKILL_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {SKILL_GROUP_LABELS[group]}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={addSkill}>
              Add
            </Button>
          </div>
        </div>
        {SKILL_GROUPS.map((group) => (
          <div key={group} className="rounded-lg border border-border bg-card">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">{SKILL_GROUP_LABELS[group]}</h3>
            <ul>
              {form.skills.map((skill, index) =>
                skill.group === group ? (
                  <li key={`${skill.group}-${skill.name}`} className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <Select aria-label={`${skill.name} status`} value={skill.status} onChange={(event) => updateSkill(index, event.target.value as SkillStatus)} className="w-40">
                        {SKILL_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {SKILL_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, skills: form.skills.filter((_, skillIndex) => skillIndex !== index) })}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        ))}
      </section>
    </form>
  );
}
