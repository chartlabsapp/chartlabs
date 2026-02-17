import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, Hash, ArrowLeft, Pencil, Trash2, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { useTimer, formatDuration } from '../hooks/useTimer';
import StatsCard from '../components/ui/StatsCard';
import './TimerPage.css';

type DatePreset = '7d' | '30d' | 'month' | 'all';

function getPresetRange(preset: DatePreset): { from: string; to: string } {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    switch (preset) {
        case '7d': {
            const d = new Date(Date.now() - 7 * 86400000);
            return { from: d.toISOString().split('T')[0], to };
        }
        case '30d': {
            const d = new Date(Date.now() - 30 * 86400000);
            return { from: d.toISOString().split('T')[0], to };
        }
        case 'month': {
            const d = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: d.toISOString().split('T')[0], to };
        }
        case 'all':
            return { from: '2000-01-01', to };
    }
}

export default function TimerPage() {
    const navigate = useNavigate();
    const { state, addTimerSession, updateTimerSession, deleteTimerSession } = useStore();
    const { projects, themes, config, timerSessions } = state;
    const timer = useTimer();

    const [timerProject, setTimerProject] = useState(projects[0]?.id || 'default');
    const [timerTheme, setTimerTheme] = useState<string>('');
    const [timerSymbol, setTimerSymbol] = useState(config.symbols[0] || '');

    // --- Date Range Filter State ---
    const [activePreset, setActivePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [listSelectedProject, setListSelectedProject] = useState<string>('all');

    // Session editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editProject, setEditProject] = useState('');
    const [editTheme, setEditTheme] = useState('');
    const [editSymbol, setEditSymbol] = useState('');
    const [editDuration, setEditDuration] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleStart = useCallback(() => {
        timer.start();
    }, [timer]);

    const handlePause = useCallback(() => {
        timer.pause();
    }, [timer]);

    const handleResume = useCallback(() => {
        timer.resume();
    }, [timer]);

    const handleStop = useCallback(() => {
        const startISO = timer.sessionStart;
        const duration = timer.stop();
        if (duration > 0 && startISO) {
            addTimerSession({
                projectId: timerProject,
                themeId: timerTheme || undefined,
                symbol: timerSymbol,
                startTime: startISO,
                endTime: new Date().toISOString(),
                duration,
                date: new Date().toISOString().split('T')[0],
            });
        }
    }, [timer, timerProject, timerSymbol, addTimerSession, timerTheme]);

    const handleReset = useCallback(() => {
        timer.reset();
    }, [timer]);

    // Session editing handlers
    const startEditing = useCallback((s: typeof timerSessions[0]) => {
        setEditingId(s.id);
        setEditProject(s.projectId);
        setEditTheme(s.themeId || '');
        setEditSymbol(s.symbol);
        const mins = Math.floor(s.duration / 60);
        const secs = s.duration % 60;
        setEditDuration(`${mins}:${String(secs).padStart(2, '0')}`);
        // Format times as HH:MM for time inputs
        const st = new Date(s.startTime);
        setEditStartTime(`${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`);
        if (s.endTime) {
            const et = new Date(s.endTime);
            setEditEndTime(`${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`);
        } else {
            setEditEndTime('');
        }
        setDeleteConfirmId(null);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingId(null);
        setDeleteConfirmId(null);
    }, []);

    const saveEditing = useCallback(() => {
        if (!editingId) return;
        // Parse duration from "M:SS" or "MM:SS" or just minutes
        let durationSeconds = 0;
        const parts = editDuration.split(':');
        if (parts.length === 2) {
            durationSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
        } else if (parts.length === 3) {
            durationSeconds = (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
        } else {
            durationSeconds = (parseInt(editDuration, 10) || 0) * 60;
        }
        // Build updated start/end times preserving the original date
        const session = timerSessions.find(s => s.id === editingId);
        const updates: Partial<typeof timerSessions[0]> = {
            projectId: editProject,
            themeId: editTheme || undefined,
            symbol: editSymbol,
            duration: durationSeconds,
        };
        if (session && editStartTime) {
            const [sh, sm] = editStartTime.split(':').map(Number);
            const startDate = new Date(session.startTime);
            startDate.setHours(sh, sm, 0, 0);
            updates.startTime = startDate.toISOString();
        }
        if (session && editEndTime) {
            const [eh, em] = editEndTime.split(':').map(Number);
            const endDate = new Date(session.endTime || session.startTime);
            endDate.setHours(eh, em, 0, 0);
            updates.endTime = endDate.toISOString();
        }
        updateTimerSession(editingId, updates);
        setEditingId(null);
    }, [editingId, editProject, editTheme, editSymbol, editDuration, editStartTime, editEndTime, updateTimerSession, timerSessions]);

    // --- Filter Handlers ---
    const dateRange = useMemo(() => {
        if (customFrom && customTo) return { from: customFrom, to: customTo };
        return getPresetRange(activePreset);
    }, [activePreset, customFrom, customTo]);

    const handlePreset = (p: DatePreset) => {
        setActivePreset(p);
        setCustomFrom('');
        setCustomTo('');
    };

    const handleCustomFrom = (v: string) => {
        setCustomFrom(v);
        setActivePreset('all');
    };
    const handleCustomTo = (v: string) => {
        setCustomTo(v);
        setActivePreset('all');
    };

    // --- Filtered Sessions ---
    const filteredSessions = useMemo(() => {
        return timerSessions
            .filter(s => {
                const sessionDate = s.date || new Date(s.startTime).toISOString().split('T')[0];
                if (sessionDate < dateRange.from || sessionDate > dateRange.to) return false;
                if (listSelectedProject !== 'all' && s.projectId !== listSelectedProject) return false;
                return true;
            })
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [timerSessions, dateRange, listSelectedProject]);

    const filteredTotal = useMemo(() => filteredSessions.reduce((sum: number, s) => sum + s.duration, 0), [filteredSessions]);

    const confirmDelete = useCallback((id: string) => {
        deleteTimerSession(id);
        setDeleteConfirmId(null);
        setEditingId(null);
    }, [deleteTimerSession]);

    // Compute sidebar summary (unfiltered)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTotal = timerSessions.filter((s) => s.date === todayStr).reduce((sum: number, s) => sum + s.duration, 0);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekTotal = timerSessions.filter((s) => s.date >= weekAgo).reduce((sum, s) => sum + s.duration, 0);

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthTotal = timerSessions.filter((s) => s.date >= monthAgo).reduce((sum, s) => sum + s.duration, 0);

    const allTimeTotal = timerSessions.reduce((sum: number, s) => sum + s.duration, 0);

    // Time by project
    const projectTimes = projects.map((p) => {
        const total = timerSessions.filter((s) => s.projectId === p.id).reduce((sum, s) => sum + s.duration, 0);
        return { ...p, total };
    }).filter((p) => p.total > 0).sort((a, b) => b.total - a.total);

    const maxProjectTime = Math.max(...projectTimes.map((p) => p.total), 1);

    // Time by asset
    const assetTimes = config.symbols.map((sym) => {
        const total = timerSessions.filter((s) => s.symbol === sym).reduce((sum, s) => sum + s.duration, 0);
        return { symbol: sym, total };
    }).filter((a) => a.total > 0).sort((a, b) => b.total - a.total);

    const maxAssetTime = Math.max(...assetTimes.map((a) => a.total), 1);

    return (
        <div className="timer-page">
            <div className="timer-nav">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft size={14} /> Back to Gallery
                </button>
            </div>
            <div className="timer-main">
                {/* Timer Circle */}
                <div className="timer-hero">
                    <div className={`timer-circle ${timer.isRunning ? 'running' : ''}`}>
                        <div className="timer-display">{timer.formattedTime}</div>
                    </div>

                    <div className="timer-controls">
                        {!timer.isRunning && timer.elapsed === 0 && (
                            <button className="btn btn-primary btn-lg timer-play" onClick={handleStart}>
                                <Play size={20} /> Start
                            </button>
                        )}
                        {timer.isRunning && (
                            <button className="btn btn-secondary btn-lg" onClick={handlePause}>
                                <Pause size={20} /> Pause
                            </button>
                        )}
                        {!timer.isRunning && timer.elapsed > 0 && (
                            <>
                                <button className="btn btn-primary btn-lg" onClick={handleResume}>
                                    <Play size={20} /> Resume
                                </button>
                                <button className="btn btn-secondary btn-lg" onClick={handleStop}>
                                    <Square size={20} /> Save Session
                                </button>
                            </>
                        )}
                        {timer.elapsed > 0 && (
                            <button className="btn btn-ghost" onClick={handleReset}>
                                <RotateCcw size={14} /> Reset
                            </button>
                        )}
                    </div>

                    <div className="timer-context">
                        <div className="form-group">
                            <label className="label">Project</label>
                            <select className="select" value={timerProject} onChange={(e) => { setTimerProject(e.target.value); setTimerTheme(''); }}>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Theme (Optional)</label>
                            <select className="select" value={timerTheme} onChange={(e) => setTimerTheme(e.target.value)}>
                                <option value="">None</option>
                                {themes.filter(c => c.projectId === timerProject).map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Symbol</label>
                            <select className="select" value={timerSymbol} onChange={(e) => setTimerSymbol(e.target.value)}>
                                {config.symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Session History */}
                <div className="timer-sessions card">
                    <div className="card-header">
                        <div className="sessions-header-left">
                            <span className="card-title">Session History</span>
                            <span className="text-secondary">{formatDuration(filteredTotal)} in view</span>
                        </div>
                        <div className="date-filter-bar timer-filters">
                            <div className="date-preset-chips">
                                <button className={`date-chip${activePreset === '7d' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('7d')}>7d</button>
                                <button className={`date-chip${activePreset === '30d' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('30d')}>30d</button>
                                <button className={`date-chip${activePreset === 'month' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('month')}>Month</button>
                                <button className={`date-chip${activePreset === 'all' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('all')}>All</button>
                            </div>
                            <select className="select select-sm filter-select" value={listSelectedProject} onChange={e => setListSelectedProject(e.target.value)}>
                                <option value="all">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="date-custom-range mini">
                                <input type="date" value={customFrom || dateRange.from} onChange={e => handleCustomFrom(e.target.value)} />
                                <span className="text-tertiary">→</span>
                                <input type="date" value={customTo || dateRange.to} onChange={e => handleCustomTo(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    {filteredSessions.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Duration</th>
                                    <th>Project</th>
                                    <th>Symbol</th>
                                    <th style={{ width: '80px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.map((s) => (
                                    editingId === s.id ? (
                                        <tr key={s.id} className="session-row editing">
                                            <td>
                                                <div className="session-edit-times">
                                                    <input
                                                        type="time"
                                                        className="input input-sm session-edit-time"
                                                        value={editStartTime}
                                                        onChange={(e) => setEditStartTime(e.target.value)}
                                                    />
                                                    <span className="text-tertiary">—</span>
                                                    <input
                                                        type="time"
                                                        className="input input-sm session-edit-time"
                                                        value={editEndTime}
                                                        onChange={(e) => setEditEndTime(e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    className="input input-sm session-edit-input"
                                                    value={editDuration}
                                                    onChange={(e) => setEditDuration(e.target.value)}
                                                    placeholder="M:SS"
                                                    title="Format: M:SS or H:MM:SS"
                                                />
                                            </td>
                                            <td>
                                                <div className="session-edit-selects">
                                                    <select className="select select-sm" value={editProject} onChange={(e) => { setEditProject(e.target.value); setEditTheme(''); }}>
                                                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                    <select className="select select-sm" value={editTheme} onChange={(e) => setEditTheme(e.target.value)}>
                                                        <option value="">No theme</option>
                                                        {themes.filter(t => t.projectId === editProject).map((t) => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <select className="select select-sm" value={editSymbol} onChange={(e) => setEditSymbol(e.target.value)}>
                                                    {config.symbols.map((sym) => <option key={sym} value={sym}>{sym}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="session-actions">
                                                    <button className="btn-icon btn-icon-success" onClick={saveEditing} title="Save"><Check size={14} /></button>
                                                    <button className="btn-icon btn-icon-ghost" onClick={cancelEditing} title="Cancel"><X size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={s.id} className="session-row">
                                            <td className="font-mono">
                                                <div className="session-date">{new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                                <div className="text-secondary" style={{ fontSize: '11px' }}>
                                                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                                </div>
                                            </td>
                                            <td className="font-mono">{formatDuration(s.duration)}</td>
                                            <td>
                                                {projects.find((p) => p.id === s.projectId)?.name || '—'}
                                                {s.themeId && <span className="text-tertiary"> / {themes.find(c => c.id === s.themeId)?.name}</span>}
                                            </td>
                                            <td><span className="badge badge-accent">{s.symbol}</span></td>
                                            <td>
                                                {deleteConfirmId === s.id ? (
                                                    <div className="session-actions">
                                                        <button className="btn-icon btn-icon-danger" onClick={() => confirmDelete(s.id)} title="Confirm delete"><Check size={14} /></button>
                                                        <button className="btn-icon btn-icon-ghost" onClick={() => setDeleteConfirmId(null)} title="Cancel"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="session-actions">
                                                        <button className="btn-icon btn-icon-ghost" onClick={() => startEditing(s)} title="Edit session"><Pencil size={13} /></button>
                                                        <button className="btn-icon btn-icon-ghost" onClick={() => setDeleteConfirmId(s.id)} title="Delete session"><Trash2 size={13} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-secondary" style={{ padding: '16px' }}>No sessions found for this period. Adjust your filters or start the timer above!</p>
                    )}
                </div>
            </div>

            <div className="timer-sidebar">
                {/* Time Summary */}
                <div className="timer-summary-cards">
                    <StatsCard label="Today" value={formatDuration(todayTotal)} />
                    <StatsCard label="This Week" value={formatDuration(weekTotal)} />
                    <StatsCard label="This Month" value={formatDuration(monthTotal)} />
                    <StatsCard label="All Time" value={formatDuration(allTimeTotal)} color="accent" />
                </div>

                {/* Time by Project / Theme */}
                {projectTimes.length > 0 && (
                    <div className="card timer-breakdown">
                        <div className="card-title">Time Usage Breakdown</div>
                        <div className="breakdown-bars">
                            {projectTimes.map((p) => {
                                const projectThemes = themes.filter(c => c.projectId === p.id);
                                const themeBreakdown = projectThemes.map(c => {
                                    const total = timerSessions.filter(s => s.themeId === c.id).reduce((sum, s) => sum + s.duration, 0);
                                    return { ...c, total };
                                }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

                                return (
                                    <div key={p.id} className="breakdown-project-group">
                                        <div className="breakdown-row main-row">
                                            <div className="breakdown-label">{p.name}</div>
                                            <div className="breakdown-bar-track">
                                                <div className="breakdown-bar" style={{ width: `${(p.total / maxProjectTime) * 100}%` }} />
                                            </div>
                                            <div className="breakdown-value font-mono">{formatDuration(p.total)}</div>
                                        </div>
                                        {themeBreakdown.map(c => (
                                            <div key={c.id} className="breakdown-row theme-row">
                                                <div className="breakdown-label"><Hash size={10} /> {c.name}</div>
                                                <div className="breakdown-bar-track">
                                                    <div className="breakdown-bar theme-bar" style={{ width: `${(c.total / p.total) * 100}%` }} />
                                                </div>
                                                <div className="breakdown-value font-mono">{formatDuration(c.total)}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Time by Asset */}
                {assetTimes.length > 0 && (
                    <div className="card timer-breakdown">
                        <div className="card-title">Time by Asset</div>
                        <div className="breakdown-bars">
                            {assetTimes.map((a) => (
                                <div key={a.symbol} className="breakdown-row">
                                    <div className="breakdown-label">{a.symbol}</div>
                                    <div className="breakdown-bar-track">
                                        <div className="breakdown-bar bar-green" style={{ width: `${(a.total / maxAssetTime) * 100}%` }} />
                                    </div>
                                    <div className="breakdown-value font-mono">{formatDuration(a.total)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
