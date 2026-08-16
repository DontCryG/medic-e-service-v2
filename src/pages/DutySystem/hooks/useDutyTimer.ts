import { useState, useEffect } from 'react';

export function useDutyTimer(currentSession: any) {
  const [dutyTime, setDutyTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (currentSession && currentSession.status === 'on_duty') {
      interval = setInterval(() => {
        const start = new Date(currentSession.clock_in).getTime();
        const now = new Date().getTime();
        const breakMs = currentSession.total_break_minutes * 60000;
        
        setDutyTime(Math.floor((now - start - breakMs) / 1000));
      }, 1000);
    } else if (currentSession && currentSession.status === 'on_break') {
      const start = new Date(currentSession.clock_in).getTime();
      const breakStart = new Date(currentSession.last_break_start).getTime();
      const prevBreakMs = currentSession.total_break_minutes * 60000;
      setDutyTime(Math.floor((breakStart - start - prevBreakMs) / 1000));
    } else {
      setDutyTime(0);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  return dutyTime;
}
