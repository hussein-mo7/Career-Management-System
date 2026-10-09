"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import { NOTE_CATEGORIES, NOTE_CATEGORY_LABELS } from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Note, NoteCategory, Page } from "@/types";

const empty = { title: "", content: "", category: "general" as NoteCategory, tags: [] as string[] };

export function NotesPage() {
  const client = useQueryClient();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Note | null>(null);
  const [draft, setDraft] = useState(empty);
  const [confirm, setConfirm] = useState(false);
  const notes = useQuery({
    queryKey: ["notes", category, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (category) params.set("category", category);
      if (search.trim()) params.set("q", search.trim());
      return api<Page<Note> & { tags: string[] }>(`/api/notes?${params.toString()}`);
    },
  });

  const save = useMutation({
    mutationFn: () =>
      api<Note>(selected ? `/api/notes/${selected.id}` : "/api/notes", {
        method: selected ? "PUT" : "POST",
        body: JSON.stringify(draft),
      }),
    onSuccess: async (note: Note) => {
      toast.success("Note saved");
      setSelected(note);
      setDraft({ title: note.title, content: note.content, category: note.category, tags: note.tags });
      await client.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/notes/${selected?.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Note deleted");
      setSelected(null);
      setDraft(empty);
      setConfirm(false);
      await client.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openNote(note: Note) {
    setSelected(note);
    setDraft({ title: note.title, content: note.content, category: note.category, tags: note.tags });
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Short notes for career ideas, interview lessons, and things you do not want to lose."
        action={<Button type="button" onClick={() => { setSelected(null); setDraft(empty); }}>New note</Button>}
      />
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" aria-label="Search notes" />
        <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Note category">
          <option value="">All categories</option>
          {NOTE_CATEGORIES.map((item) => <option key={item} value={item}>{NOTE_CATEGORY_LABELS[item]}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div>
          {notes.isLoading ? <Skeleton className="h-40" /> : null}
          {notes.isError ? <ErrorState message="Notes could not be loaded." onRetry={() => notes.refetch()} /> : null}
          {notes.data && notes.data.items.length === 0 ? <EmptyState title="No notes yet." description="Use notes for ideas that do not belong on a company or interview." /> : null}
          <ul className="space-y-2">
            {notes.data?.items.map((note) => (
              <li key={note.id}>
                <button type="button" onClick={() => openNote(note)} className="w-full rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40">
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">{NOTE_CATEGORY_LABELS[note.category]} · {formatDateTime(note.updatedAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <form className="space-y-4 rounded-lg border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
          <FormField label="Title" htmlFor="title"><Input id="title" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></FormField>
          <FormField label="Category" htmlFor="note-category"><Select id="note-category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as NoteCategory })}>{NOTE_CATEGORIES.map((item) => <option key={item} value={item}>{NOTE_CATEGORY_LABELS[item]}</option>)}</Select></FormField>
          <FormField label="Tags" hint="Type a tag and press Enter."><TagInput value={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} placeholder="Add a tag" /></FormField>
          <FormField label="Content" htmlFor="content"><TextArea id="content" className="min-h-56" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></FormField>
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending} loadingLabel="Saving…">Save note</Button>
            {selected ? <Button type="button" variant="ghost" onClick={() => setConfirm(true)}>Delete</Button> : null}
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirm} title="Delete this note?" description="The note will be permanently deleted." loading={remove.isPending} onOpenChange={setConfirm} onConfirm={() => remove.mutate()} />
    </div>
  );
}
