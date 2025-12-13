import type { Task } from '@planning-poker/shared';
import { Modal, Button, Badge } from './ui';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  roomName: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SummaryModal({ isOpen, onClose, tasks, roomName }: SummaryModalProps) {
  const votedTasks = tasks
    .filter(t => t.status === 'voted')
    .sort((a, b) => a.order - b.order);

  const totalEstimate = votedTasks.reduce((sum, t) => sum + (t.finalEstimate || 0), 0);
  const totalDuration = votedTasks.reduce((sum, t) => sum + (t.votingDurationSeconds || 0), 0);

  // Top 3 slowest tasks
  const slowestTasks = [...votedTasks]
    .filter(t => t.votingDurationSeconds !== null)
    .sort((a, b) => (b.votingDurationSeconds || 0) - (a.votingDurationSeconds || 0))
    .slice(0, 3);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${roomName} - Summary`}>
      <div className="space-y-6">
        {/* Top 3 Slowest Tasks */}
        {slowestTasks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">
              🐢 Top 3 Slowest Tasks
            </h4>
            <div className="space-y-2">
              {slowestTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">
                    {formatDuration(task.votingDurationSeconds)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tasks */}
        <div>
          <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">
            📋 All Tasks ({votedTasks.length})
          </h4>
          {votedTasks.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {votedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {formatDuration(task.votingDurationSeconds)}
                  </span>
                  <Badge variant="primary" className="min-w-[2rem] text-center">
                    {task.finalEstimate}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tasks have been voted yet.</p>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {totalEstimate}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {formatDuration(totalDuration)}
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

