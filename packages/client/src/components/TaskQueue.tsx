import { useState, useRef, useEffect } from 'react';
import type { Task } from '@planning-poker/shared';
import { Card, Button } from './ui';
import { getSocket } from '../services/socket';

interface TaskQueueProps {
  tasks: Task[];
  currentTaskId: string | null;
  canReorder?: boolean;
  isAdmin?: boolean;
  onUpdateTitle?: (taskId: string, title: string) => void;
}

export function TaskQueue({ tasks, currentTaskId, canReorder = false, isAdmin = false, onUpdateTitle }: TaskQueueProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim() && onUpdateTitle) {
      const task = tasks.find(t => t.id === editingId);
      if (task && editValue.trim() !== task.title) {
        onUpdateTitle(editingId, editValue.trim());
      }
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId && t.status === 'voting');
  
  const pendingTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => a.order - b.order);
  
  // Combine current task (if voting) with pending tasks
  const upcomingTasks = currentTask 
    ? [currentTask, ...pendingTasks]
    : pendingTasks;
  
  const votedTasks = tasks
    .filter(t => t.status === 'voted')
    .sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (taskId !== draggedId) {
      setDragOverId(taskId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetTaskId) return;

    const targetIndex = pendingTasks.findIndex(t => t.id === targetTaskId);
    if (targetIndex === -1) return;

    // Add 1 to avoid position 0 which triggers "make current"
    // Position 0 is reserved for the ⏭ button (handleMakeCurrent)
    const actualOrder = currentTask ? targetIndex + 1 : targetIndex;

    const socket = getSocket();
    socket.emit('task:reorder', { taskId: draggedId, newOrder: actualOrder });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleMakeCurrent = (taskId: string) => {
    const socket = getSocket();
    // Moving to position 0 makes it the current task
    socket.emit('task:reorder', { taskId, newOrder: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Upcoming Tasks (Current + Pending) */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          Upcoming Tasks ({upcomingTasks.length})
        </h3>
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-2">
            {upcomingTasks.map((task, index) => {
              const isCurrent = task.id === currentTaskId;
              const canDrag = canReorder && !isCurrent;
              
              return (
                <li
                  key={task.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group p-2 rounded-lg flex items-center gap-2 transition-all
                    ${isCurrent 
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' 
                      : 'bg-gray-50 dark:bg-gray-700'
                    }
                    ${canDrag ? 'cursor-move hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
                    ${draggedId === task.id ? 'opacity-50' : ''}
                    ${dragOverId === task.id ? 'ring-2 ring-primary-500' : ''}
                  `}
                >
                  {canReorder && !isCurrent && (
                    <span className="text-gray-400 text-sm">⋮⋮</span>
                  )}
                  {isCurrent ? (
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">▶</span>
                  ) : (
                    <span className="text-gray-400 text-sm w-6">#{index}</span>
                  )}
                  {editingId === task.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 bg-white dark:bg-gray-800 border border-primary-500 rounded px-2 py-0.5 text-sm outline-none"
                    />
                  ) : (
                    <span 
                      className={`flex-1 truncate ${isAdmin && onUpdateTitle ? 'group-hover:pr-6' : ''}`}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                  )}
                  {isAdmin && onUpdateTitle && editingId !== task.id && (
                    <button
                      onClick={() => startEditing(task)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-600 transition-opacity p-1"
                      title="Edit title"
                    >
                      ✏️
                    </button>
                  )}
                  {isAdmin && !isCurrent && currentTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMakeCurrent(task.id)}
                      title="Vote this now"
                      className="text-xs px-1.5 py-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      ⏭
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No pending tasks</p>
        )}
      </Card>

      {/* Voted Tasks */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          Voted Tasks ({votedTasks.length})
        </h3>
        {votedTasks.length > 0 ? (
          <ul className="space-y-2">
            {votedTasks.map((task) => (
              <li
                key={task.id}
                className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
              >
                <span className="flex-1 truncate">{task.title}</span>
                <div className="flex items-center gap-2">
                  {task.votingDurationSeconds != null && (
                    <span className="text-xs text-gray-500">
                      {Math.floor(task.votingDurationSeconds / 60)}:{(task.votingDurationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <span className="font-bold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                    {task.finalEstimate}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No voted tasks yet</p>
        )}
      </Card>
    </div>
  );
}
