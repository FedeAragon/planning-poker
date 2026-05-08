import { useEffect, useRef } from 'react';
import { useRoomStore } from '../store';

const FLASH_TITLE = '⚠ ¡Vota! · Planning Poker';
const FLASH_INTERVAL_MS = 1000;

/**
 * Coordinates the 4 attention channels when the user is the voting straggler:
 *
 * Tab visible + focused  →  pulse/banner (handled in RoomPage JSX)
 * Tab hidden / blurred   →  title flash + chime (single play)
 *
 * All effects are cleaned up when `majorityAlertActive` goes false or on unmount.
 */
export function useMajorityAlert() {
  const majorityAlertActive = useRoomStore(s => s.majorityAlertActive);
  const soundEnabled = useRoomStore(s => s.soundEnabled);

  const originalTitleRef = useRef<string>(document.title);
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chimePlayedRef = useRef(false);
  const hasFocusRef = useRef(!document.hidden);

  // Track window focus/blur independently of visibility
  useEffect(() => {
    const onFocus = () => { hasFocusRef.current = true; };
    const onBlur = () => { hasFocusRef.current = false; };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const stopFlash = () => {
      if (flashIntervalRef.current !== null) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
      document.title = originalTitleRef.current;
    };

    if (!majorityAlertActive) {
      stopFlash();
      chimePlayedRef.current = false;
      return;
    }

    // Capture original title once per alert activation
    originalTitleRef.current = document.title;

    const startFlash = () => {
      if (flashIntervalRef.current !== null) return; // already running
      let toggle = true;
      flashIntervalRef.current = setInterval(() => {
        document.title = toggle ? FLASH_TITLE : originalTitleRef.current;
        toggle = !toggle;
      }, FLASH_INTERVAL_MS);
    };

    const playChime = () => {
      if (chimePlayedRef.current || !soundEnabled) return;
      chimePlayedRef.current = true;
      try {
        const audio = new Audio('/sounds/majority-chime.mp3');
        audio.play().catch(() => {
          // Autoplay blocked — silently ignore
        });
      } catch {
        // Audio API unavailable
      }
    };

    const checkAndApply = () => {
      const isHidden = document.hidden || !hasFocusRef.current;
      if (isHidden) {
        startFlash();
        playChime();
      } else {
        stopFlash();
      }
    };

    // Apply immediately based on current visibility
    checkAndApply();

    const onVisibilityChange = () => {
      if (!majorityAlertActive) return;
      if (document.hidden) {
        startFlash();
        playChime();
      } else {
        stopFlash();
      }
    };

    const onWindowFocus = () => {
      if (!majorityAlertActive) return;
      stopFlash();
    };

    const onWindowBlur = () => {
      if (!majorityAlertActive) return;
      startFlash();
      playChime();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowBlur);
      stopFlash();
    };
  }, [majorityAlertActive, soundEnabled]);
}
