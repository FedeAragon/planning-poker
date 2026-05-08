import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { majorityAlertState } from '../../services/majority-alert.state';

describe('majorityAlertState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clean up any state left by previous tests
    majorityAlertState.clearTask('task-1');
    majorityAlertState.clearTask('task-2');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('hasAlerted / markAlerted', () => {
    it('returns false for unknown task/user', () => {
      expect(majorityAlertState.hasAlerted('task-1', 'user-1')).toBe(false);
    });

    it('returns true after markAlerted', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      expect(majorityAlertState.hasAlerted('task-1', 'user-1')).toBe(true);
    });

    it('is scoped per task — different task stays false', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      expect(majorityAlertState.hasAlerted('task-2', 'user-1')).toBe(false);
    });

    it('is idempotent — calling markAlerted twice does not throw', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      majorityAlertState.markAlerted('task-1', 'user-1');
      expect(majorityAlertState.hasAlerted('task-1', 'user-1')).toBe(true);
    });
  });

  describe('clearTask', () => {
    it('clears the alerted set for a task', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      majorityAlertState.clearTask('task-1');
      expect(majorityAlertState.hasAlerted('task-1', 'user-1')).toBe(false);
    });

    it('does not affect other tasks', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      majorityAlertState.markAlerted('task-2', 'user-1');
      majorityAlertState.clearTask('task-1');
      expect(majorityAlertState.hasAlerted('task-2', 'user-1')).toBe(true);
    });

    it('cancels a pending timer', () => {
      const fn = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn);
      majorityAlertState.clearTask('task-1');
      vi.advanceTimersByTime(10_000);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('scheduleAlert', () => {
    it('executes the callback after the delay', () => {
      const fn = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn);
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('is idempotent — a second call while timer is running is a no-op', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn1);
      majorityAlertState.scheduleAlert('task-1', 5000, fn2); // should be ignored
      vi.advanceTimersByTime(5000);
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('allows rescheduling after the timer fires', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn1);
      vi.advanceTimersByTime(5000);
      expect(fn1).toHaveBeenCalledOnce();
      // Timer has fired and removed itself — should be possible to schedule again
      majorityAlertState.scheduleAlert('task-1', 5000, fn2);
      vi.advanceTimersByTime(5000);
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe('cancelAlert', () => {
    it('prevents the callback from running', () => {
      const fn = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn);
      majorityAlertState.cancelAlert('task-1');
      vi.advanceTimersByTime(10_000);
      expect(fn).not.toHaveBeenCalled();
    });

    it('is a no-op when no timer is pending', () => {
      expect(() => majorityAlertState.cancelAlert('task-1')).not.toThrow();
    });

    it('does NOT clear the alerted set (only clearTask does that)', () => {
      majorityAlertState.markAlerted('task-1', 'user-1');
      const fn = vi.fn();
      majorityAlertState.scheduleAlert('task-1', 5000, fn);
      majorityAlertState.cancelAlert('task-1');
      expect(majorityAlertState.hasAlerted('task-1', 'user-1')).toBe(true);
    });
  });
});
