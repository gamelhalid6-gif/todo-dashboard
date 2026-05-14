import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Column from './Column';
import TaskModal from './TaskModal';
import * as api from '../sheetsApi';

const CATEGORIES = ['Priority', 'In Progress', 'Not Important'];

const COLORS = {
  Priority: '#ef4444',
  'In Progress': '#3b82f6',
  'Not Important': '#9ca3af',
};

export default function Board({ token, spreadsheetId, onAuthError }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const activeTaskRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      await api.initSheet(spreadsheetId, token);
      setTasks(await api.getTasks(spreadsheetId, token));
    } catch (err) {
      if (err.message.includes('401')) { onAuthError(); return; }
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, spreadsheetId, onAuthError]);

  useEffect(() => { loadData(); }, [loadData]);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = tasks.filter(t => t.category === cat);
    return acc;
  }, {});

  function handleDragStart({ active }) {
    const task = tasks.find(t => t.id === active.id);
    if (task) { setActiveTask(task); activeTaskRef.current = task; }
  }

  async function handleDragEnd({ over }) {
    const task = activeTaskRef.current;
    setActiveTask(null);
    activeTaskRef.current = null;
    if (!over || !task || over.id === task.category) return;

    const updated = { ...task, category: over.id };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try {
      await api.updateTask(spreadsheetId, updated, token);
    } catch {
      loadData(true);
    }
  }

  async function handleAddTask(category, title) {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      category,
      notes: '',
      active: true,
      rowIndex: tasks.length + 2,
    };
    setTasks(prev => [...prev, newTask]);
    try {
      await api.addTask(spreadsheetId, newTask, token);
      await loadData(true);
    } catch (err) {
      setError(err.message);
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
    }
  }

  async function handleDeleteTask(task) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    setSelectedTask(null);
    try {
      await api.deleteTask(spreadsheetId, task.rowIndex, token);
    } catch {
      loadData(true);
    }
  }

  async function saveNotes(notes) {
    if (!selectedTask) return;
    const updated = { ...selectedTask, notes };
    setSelectedTask(updated);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    await api.updateTask(spreadsheetId, updated, token);
  }

  async function saveTitle(title) {
    if (!selectedTask) return;
    const updated = { ...selectedTask, title };
    setSelectedTask(updated);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    await api.updateTask(spreadsheetId, updated, token);
  }

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" />
        <p>Setting up your board...</p>
      </div>
    );
  }

  return (
    <>
      <div className="board-toolbar">
        <button
          className={`btn btn-ghost refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          &#8635; Refresh
        </button>
        {error && <span className="inline-error">{error}</span>}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {CATEGORIES.map(cat => (
            <Column
              key={cat}
              name={cat}
              color={COLORS[cat]}
              tasks={grouped[cat]}
              onTaskClick={setSelectedTask}
              onAddTask={(title) => handleAddTask(cat, title)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="task-card drag-ghost">
              <span className="task-title">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onSaveNotes={saveNotes}
          onSaveTitle={saveTitle}
          onDelete={() => handleDeleteTask(selectedTask)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
