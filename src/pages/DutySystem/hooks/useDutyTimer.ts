import { useState, useEffect, useRef } from 'react';

export const MAX_BREAK_SECONDS = 15 * 60; // 15 minutes limit (900 seconds)

export interface DutyTimerResult {
  dutyTime: number;
  breakElapsedSeconds: number;
  breakRemainingSeconds: number;
  isBreakExpired: boolean;
  maxBreakSeconds: number;
}

export function useDutyTimer(
  currentSession: any, 
  options?: { onBreakTimeout?: () => void }
): DutyTimerResult {
  const [dutyTime, setDutyTime] = useState(0);
  const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0);
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    timeoutTriggeredRef.current = false;
  }, [currentSession?.id, currentSession?.last_break_start, currentSession?.status]);

  useEffect(() => {
    let interval: any = null;

    if (!currentSession) {
      setDutyTime(0);
      setBreakElapsedSeconds(0);
      return;
    }

    const start = new Date(currentSession.clock_in).getTime();
    const prevBreakMs = (Number(currentSession.total_break_minutes) || 0) * 60000;

    if (currentSession.status === 'on_duty') {
      const updateDuty = () => {
        const now = Date.now();
        setDutyTime(Math.max(0, Math.floor((now - start - prevBreakMs) / 1000)));
      };
      updateDuty();
      interval = setInterval(updateDuty, 1000);
      setBreakElapsedSeconds(0);
    } else if (currentSession.status === 'on_break' && currentSession.last_break_start) {
      const breakStart = new Date(currentSession.last_break_start).getTime();
      // Frozen duty time: exact seconds accumulated prior to break start
      setDutyTime(Math.max(0, Math.floor((breakStart - start - prevBreakMs) / 1000)));

      const updateBreak = () => {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - breakStart) / 1000));
        setBreakElapsedSeconds(elapsed);

        if (elapsed >= MAX_BREAK_SECONDS && !timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          if (options?.onBreakTimeout) {
            options.onBreakTimeout();
          }
        }
      };

      updateBreak();
      interval = setInterval(updateBreak, 1000);
    } else {
      setDutyTime(0);
      setBreakElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession, options?.onBreakTimeout]);

  const breakRemainingSeconds = Math.max(0, MAX_BREAK_SECONDS - breakElapsedSeconds);
  const isBreakExpired = breakElapsedSeconds >= MAX_BREAK_SECONDS;

  return {
    dutyTime,
    breakElapsedSeconds,
    breakRemainingSeconds,
    isBreakExpired,
    maxBreakSeconds: MAX_BREAK_SECONDS
  };
}
