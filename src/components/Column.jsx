import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function Column({ name, color, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: name });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) { setAdding(false); return; }
    onAddTask(title.trim());
    setTitle('');
    setAdding(false);
  }

  function cancel() {
    setAdding(false);
    setTitle('');
  }

  return (
    <div className={`column ${isOver ? 'column-over' : ''}`} style={{ '--col-color': color }}>
      <div className="column-header">
        <div className="column-title">
          <span className="column-dot" />
          <h2>{name}</h2>
        </div>
        <span className="task-count">{tasks.length}</span>
      </div>

      <div className="column-body" ref={setNodeRef}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && !adding && (
          <div className="empty-state">Drop tasks here</div>
        )}
      </div>

      <div className="column-footer">
        {adding ? (
          <form className="add-form" onSubmit={submit}>
            <input
              autoFocus
              className="add-input"
              placeholder="Task name..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
            />
            <div className="add-actions">
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="add-task-btn" onClick={() => setAdding(true)}>
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
