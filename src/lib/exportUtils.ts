import type { Chart, AppState } from '../types';

export function convertTradesToCSV(charts: Chart[], state: AppState): string {
    const headers = [
        'ID', 'Date', 'Symbol', 'Timeframe', 'Session', 'Project', 'Theme', 'Direction',
        'Setup', 'Entry', 'SL', 'TP', 'R:R', 'Outcome', 'P&L', 'Tags', 'Notes'
    ];

    const rows = charts.map(c => {
        const projectName = state.projects.find(p => p.id === c.projectId)?.name || 'Default';
        const themeName = state.themes.find(t => t.id === c.themeId)?.name || 'None';

        return [
            c.id,
            c.tradingDay,
            c.symbol,
            c.timeframe,
            c.session,
            projectName,
            themeName,
            c.direction,
            c.setupName,
            c.entryPrice || '',
            c.stopLoss || '',
            c.takeProfit || '',
            c.riskReward || '',
            c.outcome || '',
            c.pnl || '',
            `"${c.tags.join(', ')}"`,
            `"${c.notes.replace(/"/g, '""')}"`
        ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function convertAnalyticsToCSV(stats: any): string {
    const { overallStats, symbolStats, timeframeStats, projectTimeStats } = stats;

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    let csv = 'Metric,Value\n';
    csv += `Total Charts,${overallStats.totalCharts}\n`;
    csv += `Win Rate,${(overallStats.winRate || 0).toFixed(2)}%\n`;
    csv += `Total P&L,${(overallStats.totalPnl || 0).toFixed(2)}\n`;
    csv += `Avg R:R,${(overallStats.avgRR || 0).toFixed(2)}\n`;
    csv += `Profit Factor,${(overallStats.profitFactor || 0).toFixed(2)}\n`;
    csv += `Total Time,${formatTime(overallStats.totalTimeInvested || 0)}\n\n`;

    csv += 'Symbol,Trades,Win Rate,P&L,Time Invested\n';
    if (symbolStats && Array.isArray(symbolStats)) {
        symbolStats.forEach((s: any) => {
            csv += `${s.symbol},${s.trades},${(s.winRate || 0).toFixed(2)}%,${(s.pnl || 0).toFixed(2)},${formatTime(s.totalTime || 0)}\n`;
        });
    }
    csv += '\n';

    csv += 'Time by Project,Total Time,Percentage\n';
    if (projectTimeStats && Array.isArray(projectTimeStats)) {
        projectTimeStats.forEach((p: any) => {
            csv += `${p.projectName},${formatTime(p.totalTime || 0)},${(p.percentage || 0).toFixed(2)}%\n`;
        });
    }
    csv += '\n';

    csv += 'Timeframe,Trades,Win Rate,P&L\n';
    if (timeframeStats && Array.isArray(timeframeStats)) {
        timeframeStats.forEach((s: any) => {
            csv += `${s.timeframe},${s.trades},${(s.winRate || 0).toFixed(2)}%,${(s.pnl || 0).toFixed(2)}\n`;
        });
    }

    return csv;
}

export function downloadCSV(filename: string, csvContent: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
