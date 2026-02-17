// AnalyticsPage — Performance Analytics
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useStore, useAnalytics } from '../store';
import StatsCard from '../components/ui/StatsCard';
import { formatDuration } from '../hooks/useTimer';
import { Clock, Flame, Hash } from 'lucide-react';
import './AnalyticsPage.css';

const COLORS = ['#2962ff', '#22ab94', '#ef5350', '#ff9800', '#9c27b0', '#00bcd4', '#4caf50'];
const OUTCOME_COLORS: Record<string, string> = { Win: '#22ab94', Loss: '#ef5350', BE: '#787b86' };

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

export default function AnalyticsPage() {
    const { state } = useStore();
    const { overallStats, symbolStats } = useAnalytics();
    const { charts, timerSessions, projects, themes } = state;

    // --- Date Range Filter State ---
    const [activePreset, setActivePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [selectedProject, setSelectedProject] = useState<string>('all');

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
        setActivePreset('all'); // clear preset visual when using custom
    };
    const handleCustomTo = (v: string) => {
        setCustomTo(v);
        setActivePreset('all');
    };

    // --- Filtered timer sessions (by date + project) ---
    const filteredSessions = useMemo(() => {
        return timerSessions.filter(s => {
            if (s.date < dateRange.from || s.date > dateRange.to) return false;
            if (selectedProject !== 'all' && s.projectId !== selectedProject) return false;
            return true;
        });
    }, [timerSessions, dateRange, selectedProject]);

    // Compute totalPnL from charts
    const totalPnL = useMemo(() => {
        return charts.reduce((sum, c) => sum + (c.pnl || 0), 0);
    }, [charts]);

    // Win/Loss/BE pie data
    const outcomeData = useMemo(() => {
        const wins = charts.filter((c) => c.outcome === 'win').length;
        const losses = charts.filter((c) => c.outcome === 'loss').length;
        const be = charts.filter((c) => c.outcome === 'breakeven').length;
        return [
            { name: 'Win', value: wins },
            { name: 'Loss', value: losses },
            { name: 'BE', value: be },
        ].filter((d) => d.value > 0);
    }, [charts]);

    // Win rate by symbol bar chart
    const symbolBarData = useMemo(() => {
        return symbolStats.map((s) => ({
            name: s.symbol,
            winRate: s.winRate,
            total: s.trades,
        }));
    }, [symbolStats]);

    // P&L over time line chart
    const pnlTimeline = useMemo(() => {
        const sorted = charts
            .filter((c) => c.pnl !== undefined)
            .sort((a, b) => new Date(a.tradingDay).getTime() - new Date(b.tradingDay).getTime());

        let cumPnl = 0;
        return sorted.map((c) => {
            cumPnl += c.pnl || 0;
            return { date: c.tradingDay, pnl: cumPnl };
        });
    }, [charts]);

    // Setup stats — only charts with trade data (outcome set)
    const setupStats = useMemo(() => {
        const map = new Map<string, { wins: number; losses: number; total: number; rrSum: number; rrCount: number }>();
        charts.filter(c => c.outcome).forEach((c) => {
            const setup = c.setupName || 'Unnamed';
            const entry = map.get(setup) || { wins: 0, losses: 0, total: 0, rrSum: 0, rrCount: 0 };
            entry.total++;
            if (c.outcome === 'win') entry.wins++;
            if (c.outcome === 'loss') entry.losses++;
            if (c.riskReward && c.riskReward > 0) { entry.rrSum += c.riskReward; entry.rrCount++; }
            map.set(setup, entry);
        });
        return Array.from(map.entries()).map(([setup, s]) => ({
            setup,
            trades: s.total,
            winRate: (s.wins + s.losses) > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0,
            avgRR: s.rrCount > 0 ? s.rrSum / s.rrCount : 0,
        }));
    }, [charts]);

    // =============================================
    // TIME ANALYTICS COMPUTATIONS (filtered)
    // =============================================

    const filteredTotal = useMemo(() => filteredSessions.reduce((s, ts) => s + ts.duration, 0), [filteredSessions]);

    // Summary cards: Today / This Week / This Month / All Time (always unfiltered for context)
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = useMemo(() => timerSessions.filter(s => s.date === today).reduce((sum, s) => sum + s.duration, 0), [timerSessions, today]);
    const weekTotal = useMemo(() => {
        const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        return timerSessions.filter(s => s.date >= cutoff).reduce((sum, s) => sum + s.duration, 0);
    }, [timerSessions]);
    const monthTotal = useMemo(() => {
        const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return timerSessions.filter(s => s.date >= cutoff).reduce((sum, s) => sum + s.duration, 0);
    }, [timerSessions]);
    const allTimeTotal = useMemo(() => timerSessions.reduce((sum, s) => sum + s.duration, 0), [timerSessions]);

    // Average daily duration within the filter window
    const avgDailyDuration = useMemo(() => {
        if (filteredSessions.length === 0) return 0;
        const uniqueDays = new Set(filteredSessions.map(s => s.date));
        return filteredTotal / uniqueDays.size;
    }, [filteredSessions, filteredTotal]);

    // Daily time bar chart (filtered, stacked by project — fills every day in range)
    const dailyTimeData = useMemo(() => {
        const dayMap = new Map<string, Map<string, number>>();
        filteredSessions.forEach(s => {
            const projMap = dayMap.get(s.date) || new Map<string, number>();
            projMap.set(s.projectId, (projMap.get(s.projectId) || 0) + s.duration);
            dayMap.set(s.date, projMap);
        });
        const projectIds = [...new Set(filteredSessions.map(s => s.projectId))];

        // Build a row for every day in the range (clamp start to earliest session)
        const rows: Record<string, string | number>[] = [];
        const earliestSession = filteredSessions.length > 0
            ? filteredSessions.reduce((min, s) => s.date < min ? s.date : min, filteredSessions[0].date)
            : today;
        const startStr = dateRange.from < earliestSession ? earliestSession : dateRange.from;
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(dateRange.to + 'T00:00:00');
        const d = new Date(start);
        while (d <= end) {
            const iso = d.toISOString().split('T')[0];
            const projMap = dayMap.get(iso);
            const row: Record<string, string | number> = { date: iso.slice(5) }; // MM-DD
            projectIds.forEach(pid => {
                const pName = projects.find(p => p.id === pid)?.name || 'Unknown';
                row[pName] = projMap ? Math.round(((projMap.get(pid) || 0) / 60) * 10) / 10 : 0;
            });
            rows.push(row);
            d.setDate(d.getDate() + 1);
        }
        return rows;
    }, [filteredSessions, projects, dateRange, today]);

    const dailyChartProjectNames = useMemo(() => {
        const ids = [...new Set(filteredSessions.map(s => s.projectId))];
        return ids.map(id => projects.find(p => p.id === id)?.name || 'Unknown');
    }, [filteredSessions, projects]);

    // Time by project (filtered)
    const projectBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        filteredSessions.forEach(s => {
            map.set(s.projectId, (map.get(s.projectId) || 0) + s.duration);
        });
        return Array.from(map.entries())
            .map(([pid, total]) => ({
                id: pid,
                name: projects.find(p => p.id === pid)?.name || 'Unknown',
                total,
            }))
            .sort((a, b) => b.total - a.total);
    }, [filteredSessions, projects]);

    // Time by theme (filtered)
    const themeBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        filteredSessions.filter(s => s.themeId).forEach(s => {
            map.set(s.themeId!, (map.get(s.themeId!) || 0) + s.duration);
        });
        return Array.from(map.entries())
            .map(([tid, total]) => ({
                id: tid,
                name: themes.find(t => t.id === tid)?.name || 'Unknown',
                total,
            }))
            .filter(t => t.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [filteredSessions, themes]);

    const themePieData = useMemo(() => {
        return themeBreakdown.map(t => ({ name: t.name, value: Math.round(t.total / 60) }));
    }, [themeBreakdown]);

    // Time by symbol (filtered)
    const symbolBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        filteredSessions.forEach(s => {
            map.set(s.symbol, (map.get(s.symbol) || 0) + s.duration);
        });
        return Array.from(map.entries())
            .map(([sym, total]) => ({ symbol: sym, total }))
            .sort((a, b) => b.total - a.total);
    }, [filteredSessions]);

    // Streak counter (consecutive days with sessions, ending today or yesterday)
    const streak = useMemo(() => {
        const daysWithSessions = new Set(timerSessions.map(s => s.date));
        let count = 0;
        const d = new Date();
        // Check if today has sessions, if not start from yesterday
        if (!daysWithSessions.has(d.toISOString().split('T')[0])) {
            d.setDate(d.getDate() - 1);
        }
        while (daysWithSessions.has(d.toISOString().split('T')[0])) {
            count++;
            d.setDate(d.getDate() - 1);
        }
        return count;
    }, [timerSessions]);

    // Heatmap data (last ~13 weeks / 91 days)
    const heatmapData = useMemo(() => {
        const dayMap = new Map<string, number>();
        timerSessions.forEach(s => {
            dayMap.set(s.date, (dayMap.get(s.date) || 0) + s.duration);
        });
        const maxDuration = Math.max(...Array.from(dayMap.values()), 1);

        const weeks: { date: string; duration: number; level: number }[][] = [];
        const todayDate = new Date();
        // Go back to find the start of the grid (13 weeks ago, starting on Sunday)
        const startDate = new Date(todayDate);
        startDate.setDate(startDate.getDate() - 90);
        // Align to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        let currentWeek: { date: string; duration: number; level: number }[] = [];
        const d = new Date(startDate);
        while (d <= todayDate) {
            const dateStr = d.toISOString().split('T')[0];
            const duration = dayMap.get(dateStr) || 0;
            const level = duration === 0 ? 0 : Math.min(4, Math.ceil((duration / maxDuration) * 4));
            currentWeek.push({ date: dateStr, duration, level });
            if (d.getDay() === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            d.setDate(d.getDate() + 1);
        }
        if (currentWeek.length > 0) weeks.push(currentWeek);
        return weeks;
    }, [timerSessions]);

    // Peak hours (filtered)
    const peakHoursData = useMemo(() => {
        const hours = new Array(24).fill(0);
        filteredSessions.forEach(s => {
            if (s.startTime) {
                const h = new Date(s.startTime).getHours();
                hours[h] += s.duration;
            }
        });
        const maxH = Math.max(...hours, 1);
        return hours.map((dur, i) => ({ hour: i, duration: dur, pct: (dur / maxH) * 100 }));
    }, [filteredSessions]);

    // Time vs Win Rate correlation (filtered)
    const timeVsWinRate = useMemo(() => {
        return symbolStats
            .filter(s => s.totalTime > 0 && s.trades > 0)
            .map(s => ({
                symbol: s.symbol,
                timeMinutes: Math.round(s.totalTime / 60),
                winRate: s.winRate,
            }));
    }, [symbolStats]);

    // Weekly trend (last 12 weeks)
    const weeklyTrend = useMemo(() => {
        const weeks: { label: string; minutes: number }[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - i * 7);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            const startStr = weekStart.toISOString().split('T')[0];
            const endStr = weekEnd.toISOString().split('T')[0];
            const total = timerSessions
                .filter(s => s.date >= startStr && s.date <= endStr)
                .reduce((sum, s) => sum + s.duration, 0);
            weeks.push({
                label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                minutes: Math.round(total / 60),
            });
        }
        return weeks;
    }, [timerSessions]);

    const maxProjectBreakdown = Math.max(...projectBreakdown.map(p => p.total), 1);
    const maxSymbolBreakdown = Math.max(...symbolBreakdown.map(s => s.total), 1);

    const tooltipStyle = { background: '#1e222d', border: '1px solid #363a45', borderRadius: 8, color: '#d1d4dc' };

    return (
        <div className="analytics-page">
            <h2 className="analytics-title">Performance Analytics</h2>

            {/* Summary Stats */}
            <div className="analytics-stats">
                <StatsCard label="Total Charts" value={overallStats.totalCharts} />
                <StatsCard label="Win Rate" value={`${overallStats.winRate.toFixed(1)}%`} color={overallStats.winRate >= 50 ? 'green' : 'red'} />
                <StatsCard label="Avg R:R" value={overallStats.avgRR > 0 ? overallStats.avgRR.toFixed(2) : '—'} color="accent" />
                <StatsCard label="Total P&L" value={totalPnL !== 0 ? `$${totalPnL.toFixed(2)}` : '—'} color={totalPnL >= 0 ? 'green' : 'red'} />
            </div>

            {/* Charts Row */}
            <div className="analytics-charts-row">
                {/* Outcome Pie */}
                <div className="card analytics-chart">
                    <div className="card-title">Outcome Distribution</div>
                    {outcomeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                                    {outcomeData.map((entry) => (
                                        <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-placeholder">No outcome data yet</div>
                    )}
                </div>

                {/* Win Rate by Symbol Bar */}
                <div className="card analytics-chart">
                    <div className="card-title">Win Rate by Symbol</div>
                    {symbolBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={symbolBarData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#363a45" />
                                <XAxis dataKey="name" tick={{ fill: '#787b86', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#787b86', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="winRate" fill="#2962ff" radius={[4, 4, 0, 0]}>
                                    {symbolBarData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-placeholder">No symbol data yet</div>
                    )}
                </div>
            </div>

            {/* P&L Timeline */}
            <div className="card analytics-chart analytics-wide">
                <div className="card-title">Cumulative P&L</div>
                {pnlTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={pnlTimeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#363a45" />
                            <XAxis dataKey="date" tick={{ fill: '#787b86', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#787b86', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="pnl" stroke="#22ab94" strokeWidth={2} dot={{ fill: '#22ab94', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="chart-placeholder">Add P&L data to see your equity curve</div>
                )}
            </div>

            {/* Detailed Tables */}
            <div className="analytics-tables">
                <div className="card analytics-table-card">
                    <div className="card-title">Performance by Symbol</div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Trades</th>
                                <th>Win Rate</th>
                                <th>Avg R:R</th>
                            </tr>
                        </thead>
                        <tbody>
                            {symbolStats.map((row) => (
                                <tr key={row.symbol}>
                                    <td><span className="badge badge-accent">{row.symbol}</span></td>
                                    <td>{row.trades}</td>
                                    <td className={row.winRate >= 50 ? 'text-green' : 'text-red'}>{row.winRate.toFixed(1)}%</td>
                                    <td className="font-mono">{row.avgRR > 0 ? row.avgRR.toFixed(2) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card analytics-table-card">
                    <div className="card-title">Performance by Setup</div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Setup</th>
                                <th>Trades</th>
                                <th>Win Rate</th>
                                <th>Avg R:R</th>
                            </tr>
                        </thead>
                        <tbody>
                            {setupStats.map((row) => (
                                <tr key={row.setup}>
                                    <td>{row.setup}</td>
                                    <td>{row.trades}</td>
                                    <td className={row.winRate >= 50 ? 'text-green' : 'text-red'}>{row.winRate.toFixed(1)}%</td>
                                    <td className="font-mono">{row.avgRR > 0 ? row.avgRR.toFixed(2) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =============================================
                TIME ANALYTICS SECTION
                ============================================= */}
            <div className="time-analytics-section">
                <div className="time-analytics-header">
                    <div className="time-analytics-title">
                        <Clock size={18} /> Time Analytics
                    </div>
                    <div className="date-filter-bar">
                        <div className="date-preset-chips">
                            <button className={`date-chip${activePreset === '7d' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('7d')}>7 Days</button>
                            <button className={`date-chip${activePreset === '30d' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('30d')}>30 Days</button>
                            <button className={`date-chip${activePreset === 'month' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('month')}>This Month</button>
                            <button className={`date-chip${activePreset === 'all' && !customFrom ? ' active' : ''}`} onClick={() => handlePreset('all')}>All Time</button>
                        </div>
                        <select className="select" style={{ width: 'auto', minWidth: 120, height: 30, fontSize: 12 }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                            <option value="all">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="date-custom-range">
                            <input type="date" value={customFrom || dateRange.from} onChange={e => handleCustomFrom(e.target.value)} />
                            <span>→</span>
                            <input type="date" value={customTo || dateRange.to} onChange={e => handleCustomTo(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Time Summary Cards */}
                <div className="time-summary-cards">
                    <StatsCard label="Today" value={formatDuration(todayTotal)} />
                    <StatsCard label="This Week" value={formatDuration(weekTotal)} />
                    <StatsCard label="This Month" value={formatDuration(monthTotal)} />
                    <StatsCard label="All Time" value={formatDuration(allTimeTotal)} color="accent" />
                </div>

                {/* Row: Filtered Total + Avg Daily + Streak */}
                <div className="time-summary-cards" style={{ marginBottom: 'var(--space-lg)' }}>
                    <StatsCard label="Filtered Total" value={formatDuration(filteredTotal)} color="accent" />
                    <StatsCard label="Avg. Daily" value={formatDuration(Math.round(avgDailyDuration))} />
                    <StatsCard label="Sessions" value={filteredSessions.length} />
                    <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="streak-card">
                            <Flame size={22} className="streak-fire" style={{ color: streak > 0 ? '#ff9800' : '#787b86' }} />
                            <div>
                                <div className="streak-number">{streak}</div>
                                <div className="streak-label">day streak</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Time Chart (wide) */}
                <div className="card time-chart-card time-chart-wide" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="card-title">Daily Time (minutes)</div>
                    {dailyTimeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dailyTimeData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#363a45" />
                                <XAxis dataKey="date" tick={{ fill: '#787b86', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#787b86', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                {dailyChartProjectNames.map((name, i) => (
                                    <Bar key={name} dataKey={name} stackId="a" fill={COLORS[i % COLORS.length]} maxBarSize={24} radius={i === dailyChartProjectNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-placeholder">No timer sessions in this period</div>
                    )}
                </div>

                {/* Session Heatmap (wide) */}
                <div className="card time-chart-card time-chart-wide" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="card-title">Activity Heatmap (last 13 weeks)</div>
                    <div className="heatmap-container" style={{ display: 'flex' }}>
                        <div className="heatmap-day-labels">
                            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
                                <div key={i} className="heatmap-day-label">{l}</div>
                            ))}
                        </div>
                        <div className="heatmap-grid">
                            {heatmapData.map((week, wi) => (
                                <div key={wi} className="heatmap-week">
                                    {week.map(cell => (
                                        <div
                                            key={cell.date}
                                            className="heatmap-cell"
                                            data-level={cell.level}
                                            title={`${cell.date}: ${formatDuration(cell.duration)}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="heatmap-legend">
                        <span className="heatmap-legend-label">Less</span>
                        {[0, 1, 2, 3, 4].map(l => (
                            <div key={l} className="heatmap-cell" data-level={l} style={{ width: 12, height: 12 }} />
                        ))}
                        <span className="heatmap-legend-label">More</span>
                    </div>
                </div>

                {/* Two-Column Row: Project & Theme Breakdown */}
                <div className="time-charts-grid">
                    {/* Time by Project */}
                    <div className="card time-chart-card">
                        <div className="card-title">Time by Project</div>
                        {projectBreakdown.length > 0 ? (
                            <div className="analytics-breakdown-bars">
                                {projectBreakdown.map(p => {
                                    const projectThemes = themes.filter(t => t.projectId === p.id);
                                    const themeRows = projectThemes.map(t => {
                                        const total = filteredSessions.filter(s => s.themeId === t.id).reduce((sum, s) => sum + s.duration, 0);
                                        return { ...t, total };
                                    }).filter(t => t.total > 0).sort((a, b) => b.total - a.total);
                                    return (
                                        <div key={p.id}>
                                            <div className="analytics-breakdown-row">
                                                <div className="analytics-breakdown-label">{p.name}</div>
                                                <div className="analytics-bar-track">
                                                    <div className="analytics-bar-fill" style={{ width: `${(p.total / maxProjectBreakdown) * 100}%` }} />
                                                </div>
                                                <div className="analytics-breakdown-value font-mono">{formatDuration(p.total)}</div>
                                            </div>
                                            {themeRows.map(t => (
                                                <div key={t.id} className="analytics-breakdown-row sub-row">
                                                    <div className="analytics-breakdown-label"><Hash size={10} /> {t.name}</div>
                                                    <div className="analytics-bar-track">
                                                        <div className="analytics-bar-fill" style={{ width: `${(t.total / p.total) * 100}%` }} />
                                                    </div>
                                                    <div className="analytics-breakdown-value font-mono">{formatDuration(t.total)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="chart-placeholder">No project data in this period</div>
                        )}
                    </div>

                    {/* Time by Theme (Donut) */}
                    <div className="card time-chart-card">
                        <div className="card-title">Time by Theme</div>
                        {themePieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={themePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value}m)`}>
                                        {themePieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => `${value ?? 0} min`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-placeholder">No theme data in this period</div>
                        )}
                    </div>
                </div>

                {/* Two-Column Row: Symbol Breakdown & Peak Hours */}
                <div className="time-charts-grid">
                    {/* Time by Symbol */}
                    <div className="card time-chart-card">
                        <div className="card-title">Time by Symbol</div>
                        {symbolBreakdown.length > 0 ? (
                            <div className="analytics-breakdown-bars">
                                {symbolBreakdown.map(s => (
                                    <div key={s.symbol} className="analytics-breakdown-row">
                                        <div className="analytics-breakdown-label">{s.symbol}</div>
                                        <div className="analytics-bar-track">
                                            <div className="analytics-bar-fill bar-green" style={{ width: `${(s.total / maxSymbolBreakdown) * 100}%` }} />
                                        </div>
                                        <div className="analytics-breakdown-value font-mono">{formatDuration(s.total)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="chart-placeholder">No symbol data in this period</div>
                        )}
                    </div>

                    {/* Peak Hours */}
                    <div className="card time-chart-card">
                        <div className="card-title">Peak Study Hours</div>
                        {filteredSessions.length > 0 ? (
                            <>
                                <div className="peak-hours-grid">
                                    {peakHoursData.map(h => (
                                        <div
                                            key={h.hour}
                                            className="peak-hour-bar"
                                            style={{ height: `${Math.max(h.pct, 2)}%` }}
                                            title={`${h.hour}:00 — ${formatDuration(h.duration)}`}
                                        />
                                    ))}
                                </div>
                                <div className="peak-hours-labels">
                                    {peakHoursData.map(h => (
                                        <div key={h.hour} className="peak-hour-label">{h.hour}</div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="chart-placeholder">No data in this period</div>
                        )}
                    </div>
                </div>

                {/* Two-Column Row: Weekly Trend & Time vs Win Rate */}
                <div className="time-charts-grid">
                    {/* Weekly Trend */}
                    <div className="card time-chart-card">
                        <div className="card-title">Weekly Trend (12 weeks)</div>
                        {weeklyTrend.some(w => w.minutes > 0) ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={weeklyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#363a45" />
                                    <XAxis dataKey="label" tick={{ fill: '#787b86', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#787b86', fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => `${value ?? 0} min`} />
                                    <Line type="monotone" dataKey="minutes" stroke="#2962ff" strokeWidth={2} dot={{ fill: '#2962ff', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-placeholder">No weekly data yet</div>
                        )}
                    </div>

                    {/* Time vs Win Rate Correlation */}
                    <div className="card time-chart-card">
                        <div className="card-title">Time vs Win Rate (by Symbol)</div>
                        {timeVsWinRate.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={timeVsWinRate} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#363a45" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#787b86', fontSize: 11 }} />
                                    <YAxis dataKey="symbol" type="category" tick={{ fill: '#787b86', fontSize: 11 }} width={60} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined, name?: string) => name === 'winRate' ? `${(v ?? 0).toFixed(1)}%` : `${v ?? 0} min`} />
                                    <Bar dataKey="winRate" fill="#22ab94" radius={[0, 4, 4, 0]} name="Win Rate" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-placeholder">Need both time and trade data per symbol</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
