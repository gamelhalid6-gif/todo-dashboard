import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && due < new Date();
  const dueLabel = due
    ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'is-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="task-title">{task.title}</span>
      <div className="task-card-footer">
        {dueLabel && (
          <span className={`due-badge ${isOverdue ? 'overdue' : ''}`}>{dueLabel}</span>
        )}
        <button
          className={`notes-btn ${task.notes ? 'has-notes' : ''}`}
          title={task.notes ? 'View notes' : 'Add notes'}
          onClick={e => { e.stopPropagation(); onClick(task); }}
          onPointerDown={e => e.stopPropagation()}
        >
          {task.notes ? '📝' : '···'}
        </button>
      </div>
    </div>
  );
}
