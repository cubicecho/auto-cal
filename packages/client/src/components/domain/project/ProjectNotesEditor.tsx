import type { ProjectNote_EditorFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@apollo/client/react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';

export const PROJECT_NOTE_FRAGMENT = graphql(`
  fragment ProjectNote_Editor on ProjectNote {
    id
    title
    content
    position
  }
`);

const CREATE_NOTE = graphql(`
  mutation CreateProjectNote($input: CreateProjectNoteArgs!) {
    myCreateProjectNote(input: $input) {
      ...ProjectNote_Editor
    }
  }
`);

const UPDATE_NOTE = graphql(`
  mutation UpdateProjectNote($input: UpdateProjectNoteArgs!) {
    myUpdateProjectNote(input: $input) {
      ...ProjectNote_Editor
    }
  }
`);

const DELETE_NOTE = graphql(`
  mutation DeleteProjectNote($id: ID!) {
    myDeleteProjectNote(id: $id)
  }
`);

const REORDER_NOTES = graphql(`
  mutation ReorderProjectNotes($input: ReorderProjectNotesArgs!) {
    myReorderProjectNotes(input: $input) {
      id
      position
    }
  }
`);

type Note = ProjectNote_EditorFragment;

type ProjectNotesEditorProps = {
  projectId: string;
  notes: Note[];
};

export function ProjectNotesEditor({
  projectId,
  notes,
}: ProjectNotesEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null,
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Keep the local draft in sync when the selected note changes (or its
  // persisted content changes underneath us after a save/refetch).
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on identity + persisted values, not the derived object
  useEffect(() => {
    setTitle(selected?.title ?? '');
    setContent(selected?.content ?? '');
  }, [selected?.id, selected?.title, selected?.content]);

  // If the selected note disappears (deleted), fall back to the first note.
  useEffect(() => {
    if (selectedId && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0]?.id ?? null);
    }
  }, [notes, selectedId]);

  const [createNote, { loading: creating }] = useMutation(CREATE_NOTE, {
    refetchQueries: ['GetProjectDetail'],
  });
  const [updateNote, { loading: saving }] = useMutation(UPDATE_NOTE, {
    refetchQueries: ['GetProjectDetail'],
  });
  const [deleteNote] = useMutation(DELETE_NOTE, {
    refetchQueries: ['GetProjectDetail'],
  });
  const [reorderNotes] = useMutation(REORDER_NOTES, {
    refetchQueries: ['GetProjectDetail'],
  });

  async function handleAdd() {
    const result = await createNote({
      variables: { input: { projectId, title: 'Untitled note', content: '' } },
    });
    const created = result.data?.myCreateProjectNote;
    if (created) setSelectedId(created.id);
  }

  async function handleSave() {
    if (!selected) return;
    await updateNote({
      variables: { input: { id: selected.id, title, content } },
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteNote({ variables: { id: deleteTarget.id } });
    setDeleteTarget(null);
  }

  async function handleMove(note: Note, direction: -1 | 1) {
    const ordered = [...notes].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((n) => n.id === note.id);
    const target = idx + direction;
    if (target < 0 || target >= ordered.length) return;
    const swapped = ordered[target];
    if (!swapped) return;
    ordered[target] = note;
    ordered[idx] = swapped;
    await reorderNotes({
      variables: {
        input: { projectId, noteIds: ordered.map((n) => n.id) },
      },
    });
  }

  const dirty =
    !!selected && (title !== selected.title || content !== selected.content);
  const orderedNotes = [...notes].sort((a, b) => a.position - b.position);

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      {/* Note list */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleAdd}
          disabled={creating}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add note
        </Button>
        {orderedNotes.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No notes yet.
          </p>
        )}
        <ul className="space-y-1">
          {orderedNotes.map((note, i) => (
            <li
              key={note.id}
              className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${
                note.id === selectedId ? 'bg-muted' : 'hover:bg-muted/60'
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => setSelectedId(note.id)}
              >
                {note.title || 'Untitled note'}
              </button>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={i === 0}
                  onClick={() => handleMove(note, -1)}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={i === orderedNotes.length - 1}
                  onClick={() => handleMove(note, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:text-destructive"
                  onClick={() => setDeleteTarget(note)}
                  aria-label={`Delete ${note.title || 'note'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor / preview */}
      {selected ? (
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="font-medium"
          />
          <Tabs defaultValue="edit">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
            <TabsContent value="edit">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write markdown…"
                className="min-h-[320px] font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[320px] rounded-md border p-4">
                <MarkdownPreview content={content} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-md border border-dashed py-16 text-sm text-muted-foreground">
          Select or add a note to start writing.
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete note?"
        description={
          <>
            &ldquo;{deleteTarget?.title || 'Untitled note'}&rdquo; will be
            permanently deleted.
          </>
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
