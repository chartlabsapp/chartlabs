// ============================================
// ChartLabs — Timer Hook
// ============================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'btpro_timer';

interface TimerStorageData {
    accumulated: number;
    isRunning: boolean;
    startTime: number | null;
    sessionStart: string | null;
}

interface UseTimerReturn {
    elapsed: number; // seconds
    isRunning: boolean;
    sessionStart: string | null; // ISO string — persisted across navigation
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => number; // returns total elapsed seconds
    reset: () => void;
    formattedTime: string;
}

export function useTimer(): UseTimerReturn {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionStart, setSessionStart] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const accumulatedRef = useRef<number>(0);
    // Use a ref to track isRunning so callbacks always see the latest value
    const isRunningRef = useRef(false);

    // Keep the ref in sync with state
    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    // Restore from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data: TimerStorageData = JSON.parse(saved);
                accumulatedRef.current = data.accumulated || 0;
                if (data.sessionStart) {
                    setSessionStart(data.sessionStart);
                }
                if (data.isRunning && data.startTime) {
                    const now = Date.now();
                    const additionalMs = now - data.startTime;
                    accumulatedRef.current += Math.floor(additionalMs / 1000);
                    startTimeRef.current = now;
                    setIsRunning(true);
                    setElapsed(accumulatedRef.current);
                } else {
                    setElapsed(accumulatedRef.current);
                }
            } catch { /* ignore corrupt data */ }
        }
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        const data: TimerStorageData = {
            accumulated: accumulatedRef.current,
            isRunning,
            startTime: isRunning ? startTimeRef.current : null,
            sessionStart,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [isRunning, elapsed, sessionStart]);

    // Tick interval
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                const now = Date.now();
                const total = accumulatedRef.current + Math.floor((now - startTimeRef.current) / 1000);
                setElapsed(total);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const start = useCallback(() => {
        accumulatedRef.current = 0;
        startTimeRef.current = Date.now();
        const startISO = new Date().toISOString();
        setElapsed(0);
        setIsRunning(true);
        setSessionStart(startISO);
    }, []);

    const pause = useCallback(() => {
        if (isRunningRef.current) {
            const now = Date.now();
            accumulatedRef.current += Math.floor((now - startTimeRef.current) / 1000);
            setIsRunning(false);
            setElapsed(accumulatedRef.current);
        }
    }, []);

    const resume = useCallback(() => {
        startTimeRef.current = Date.now();
        setIsRunning(true);
    }, []);

    const stop = useCallback(() => {
        let total = accumulatedRef.current;
        if (isRunningRef.current) {
            const now = Date.now();
            total += Math.floor((now - startTimeRef.current) / 1000);
        }
        // Fully reset the timer so UI returns to "Start" state
        setIsRunning(false);
        setElapsed(0);
        accumulatedRef.current = 0;
        startTimeRef.current = 0;
        setSessionStart(null);
        localStorage.removeItem(STORAGE_KEY);
        return total;
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setElapsed(0);
        accumulatedRef.current = 0;
        startTimeRef.current = 0;
        setSessionStart(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const formattedTime = formatSeconds(elapsed);

    // Return a stable object reference to avoid unnecessary re-renders
    return useMemo(() => ({
        elapsed, isRunning, sessionStart, start, pause, resume, stop, reset, formattedTime,
    }), [elapsed, isRunning, sessionStart, start, pause, resume, stop, reset, formattedTime]);
}

export function formatSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
