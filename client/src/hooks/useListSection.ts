import { useState } from 'react';

// Open/edit state shared by every list section that pairs a grid/list with a
// create-or-edit form dialog. `editing` is null in create mode, the row in edit
// mode; closing the dialog always clears it.
export function useListSection<T>() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setFormOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditing(null);
  }

  return { formOpen, editing, openCreate, openEdit, handleOpenChange };
}
