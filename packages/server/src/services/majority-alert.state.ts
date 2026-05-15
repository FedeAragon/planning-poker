/**
 * In-memory state for majority-alert feature.
 *
 * Tracks which users have already been alerted per task (idempotency)
 * and manages the pending delay timers so they can be cancelled on
 * reveal / reset / task change.
 */

const alertedByTask = new Map<string, Set<string>>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const majorityAlertState = {
  hasAlerted(taskId: string, userId: string): boolean {
    return alertedByTask.get(taskId)?.has(userId) ?? false;
  },

  markAlerted(taskId: string, userId: string): void {
    if (!alertedByTask.has(taskId)) {
      alertedByTask.set(taskId, new Set());
    }
    alertedByTask.get(taskId)!.add(userId);
  },

  /**
   * Schedule the majority alert callback after `delayMs`.
   * Idempotent: if a timer is already running for `taskId`, does nothing.
   */
  scheduleAlert(taskId: string, delayMs: number, fn: () => void): void {
    if (pendingTimers.has(taskId)) return;
    const timer = setTimeout(() => {
      pendingTimers.delete(taskId);
      fn();
    }, delayMs);
    pendingTimers.set(taskId, timer);
  },

  /** Cancel a pending timer without clearing the alerted set. */
  cancelAlert(taskId: string): void {
    const timer = pendingTimers.get(taskId);
    if (timer !== undefined) {
      clearTimeout(timer);
      pendingTimers.delete(taskId);
    }
  },

  /** Cancel timer AND clear the alerted-users set (full reset for a task). */
  clearTask(taskId: string): void {
    this.cancelAlert(taskId);
    alertedByTask.delete(taskId);
  },
};
