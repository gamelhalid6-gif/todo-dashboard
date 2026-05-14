import { useState, useEffect, useRef } from 'react';

export default function TaskModal({ task, onSaveNotes, onSaveTitle, onDelete, onClose }) {
  const [notes, setNotes] = useState(task.notes || '');
  const [title, setTitle] = useState(task.title);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const notesTimer = useRef(null);

  useEffect(() => {
    setNotes(task.notes || '');
    setTitle(task.title);
  }, [task.id]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleNotesChange(e) {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true);
      try { await onSaveNotes(val); } finally { setSavingNotes(false); }
    }, 800);
  }

  async function handleTitleBlur() {
    if (!title.trim() || title === task.title) return;
    setSavingTitle(true);
    try { await onSaveTitle(title.trim()); } finally { setSavingTitle(false); }
  }

  function handleDelete() {
    if (window.confirm(`Delete "${task.title}"?`)) onDelete();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <input
            className="modal-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />
          <div className="modal-header-actions">
            {(savingTitle || savingNotes) && <span className="save-indicator">Saving...</span>}
            <button className="icon-btn delete-btn" title="Delete task" onClick={handleDelete}>&#128465;</button>
            <button className="close-btn" onClick={onClose}>&#10005;</button>
          </div>
        </div>
        <div className="modal-body">
          {task.dueDate && (
            <div className="modal-due">
              Due: {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          )}
          <label className="field-label">Notes</label>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Write notes, links, or context for this task..."
            rows={10}
            autoFocus
          />
          <div className="save-row">
            {savingNotes
              ? <span className="save-indicator">Saving...</span>
              : notes
                ? <span className="save-indicator saved">&#10003; Saved to Google Sheets</span>
                : null
            }
          </div>
        </div>
      </div>
    </div>
  );
}
