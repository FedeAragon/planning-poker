import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMajorityAlert } from '../useMajorityAlert';
import { useRoomStore } from '../../store';

// Stub Audio globally
const mockPlay = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({ play: mockPlay })));

function setAlertState(majorityAlertActive: boolean, soundEnabled = true) {
  act(() => {
    useRoomStore.setState({ majorityAlertActive, soundEnabled });
  });
}

describe('useMajorityAlert', () => {
  const originalTitle = 'Planning Poker';

  beforeEach(() => {
    vi.useFakeTimers();
    document.title = originalTitle;
    mockPlay.mockClear();
    (Audio as unknown as ReturnType<typeof vi.fn>).mockClear();
    // Reset store to safe defaults
    useRoomStore.setState({ majorityAlertActive: false, soundEnabled: true });
    // Tab starts visible and focused
    Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.title = originalTitle;
  });

  it('does not alter title when alert is inactive', () => {
    setAlertState(false);
    renderHook(() => useMajorityAlert());
    vi.advanceTimersByTime(3000);
    expect(document.title).toBe(originalTitle);
  });

  it('does not alter title when active but tab is visible and focused', () => {
    setAlertState(true);
    renderHook(() => useMajorityAlert());
    vi.advanceTimersByTime(3000);
    expect(document.title).toBe(originalTitle);
  });

  it('flashes title when active and tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true);
    renderHook(() => useMajorityAlert());
    // After 1 interval the title should have flipped at least once
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe('⚠ ¡Vota! · Planning Poker');
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(originalTitle);
  });

  it('restores original title when alert goes from active to inactive', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true);
    const { rerender } = renderHook(() => useMajorityAlert());
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe('⚠ ¡Vota! · Planning Poker');

    setAlertState(false);
    rerender();
    expect(document.title).toBe(originalTitle);
  });

  it('restores original title on unmount', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true);
    const { unmount } = renderHook(() => useMajorityAlert());
    vi.advanceTimersByTime(1000);
    unmount();
    expect(document.title).toBe(originalTitle);
  });

  it('plays chime once when active and tab is hidden, with sound enabled', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true, true);
    renderHook(() => useMajorityAlert());
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  it('does NOT play chime when sound is disabled', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true, false);
    renderHook(() => useMajorityAlert());
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('does NOT play chime when active but tab is visible', () => {
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    setAlertState(true, true);
    renderHook(() => useMajorityAlert());
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('plays chime only once even if called multiple times while hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true, true);
    const { rerender } = renderHook(() => useMajorityAlert());
    rerender();
    rerender();
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  it('resets chime played flag when alert goes inactive then active again', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    setAlertState(true, true);
    const { rerender } = renderHook(() => useMajorityAlert());
    expect(mockPlay).toHaveBeenCalledOnce();

    // Dismiss
    setAlertState(false, true);
    rerender();

    // New alert cycle
    mockPlay.mockClear();
    setAlertState(true, true);
    rerender();
    expect(mockPlay).toHaveBeenCalledOnce();
  });
});
