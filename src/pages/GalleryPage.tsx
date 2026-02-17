// GalleryPage — Dashboard Gallery
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, Timer, ChevronRight } from 'lucide-react';
import { useStore, useAnalytics } from '../store';
import StatsCard from '../components/ui/StatsCard';
import ChartCard from '../components/ui/ChartCard';
import AddChartModal from '../components/features/AddChartModal';
import { formatDuration } from '../hooks/useTimer';
import './GalleryPage.css';

export default function GalleryPage() {
    const { state, deleteChart } = useStore();
    const { overallStats } = useAnalytics();
    const { charts, projects, themes, config } = state;
    const [searchParams] = useSearchParams();

    const [search, setSearch] = useState('');
    const [filterProject, setFilterProject] = useState('all');
    const [filterTheme, setFilterTheme] = useState('all');
    const [filterSymbol, setFilterSymbol] = useState('all');
    const [filterTimeframe, setFilterTimeframe] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    const [pastedImage, setPastedImage] = useState<Blob | null>(null);

    // Handle paste from clipboard to open modal
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (showAddModal) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                if (blob) {
                    // If focused on an input, wait to see if it's text. 
                    // But usually image paste is intended for the app.
                    setPastedImage(blob);
                    setShowAddModal(true);
                    e.preventDefault(); // Prevent accidental paste into search
                }
            }
        }
    }, [showAddModal]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste, true);
        return () => window.removeEventListener('paste', handlePaste, true);
    }, [handlePaste]);

    useEffect(() => {
        const p = searchParams.get('project');
        const t = searchParams.get('theme');
        if (p) setFilterProject(p);
        if (t) setFilterTheme(t);
    }, [searchParams]);

    const filteredCharts = useMemo(() => {
        return charts.filter((c) => {
            if (filterProject !== 'all' && c.projectId !== filterProject) return false;
            if (filterTheme !== 'all' && c.themeId !== filterTheme) return false;
            if (filterSymbol !== 'all' && c.symbol !== filterSymbol) return false;
            if (filterTimeframe !== 'all' && c.timeframe !== filterTimeframe) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    c.symbol.toLowerCase().includes(q) ||
                    c.setupName.toLowerCase().includes(q) ||
                    c.notes.toLowerCase().includes(q) ||
                    c.tags.some((t) => t.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [charts, search, filterProject, filterTheme, filterSymbol, filterTimeframe]);

    return (
        <div className="gallery-page">
            {/* Breadcrumbs */}
            {(filterProject !== 'all' || filterTheme !== 'all') && (
                <div className="breadcrumbs">
                    <button className="breadcrumb-item" onClick={() => { setFilterProject('all'); setFilterTheme('all'); }}>
                        Gallery
                    </button>
                    {filterProject !== 'all' && (
                        <>
                            <ChevronRight size={14} className="breadcrumb-separator" />
                            <button className="breadcrumb-item" onClick={() => setFilterTheme('all')}>
                                {projects.find(p => p.id === filterProject)?.name || 'Project'}
                            </button>
                        </>
                    )}
                    {filterTheme !== 'all' && (
                        <>
                            <ChevronRight size={14} className="breadcrumb-separator" />
                            <span className="breadcrumb-item active">
                                {themes.find(c => c.id === filterTheme)?.name || 'Theme'}
                            </span>
                        </>
                    )}
                </div>
            )}
            {/* Top Bar */}
            <div className="gallery-topbar">
                <div className="gallery-search">
                    <Search size={16} />
                    <input
                        className="input"
                        placeholder="Search charts, setups, tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="gallery-filters">
                    <select className="select" value={filterProject} onChange={(e) => { setFilterProject(e.target.value); setFilterTheme('all'); }}>
                        <option value="all">All Projects</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="select" value={filterTheme} onChange={(e) => setFilterTheme(e.target.value)}>
                        <option value="all">All Themes {filterProject !== 'all' ? `in ${projects.find(p => p.id === filterProject)?.name}` : ''}</option>
                        {themes
                            .filter(c => filterProject === 'all' || c.projectId === filterProject)
                            .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="select" value={filterSymbol} onChange={(e) => setFilterSymbol(e.target.value)}>
                        <option value="all">All Symbols</option>
                        {config.symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="select" value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)}>
                        <option value="all">All Timeframes</option>
                        {config.timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> New Chart
                </button>
            </div>

            {/* Stats Row */}
            <div className="gallery-stats">
                <StatsCard label="Total Charts" value={overallStats.totalCharts} icon={<LayoutGrid size={16} />} />
                <StatsCard
                    label="Win Rate"
                    value={overallStats.totalCharts > 0 ? `${overallStats.winRate.toFixed(1)}%` : '—'}
                    color={overallStats.winRate >= 50 ? 'green' : 'red'}
                />
                <StatsCard
                    label="Avg R:R"
                    value={overallStats.avgRR > 0 ? overallStats.avgRR.toFixed(2) : '—'}
                    color="accent"
                />
                <StatsCard
                    label="Time Invested"
                    value={formatDuration(overallStats.totalTimeInvested)}
                    icon={<Timer size={16} />}
                />
            </div>

            {/* Chart Grid */}
            <div className="gallery-section-header">
                <h3 className="gallery-section-title">Recent Backtests</h3>
                <span className="gallery-section-count">{filteredCharts.length}</span>
            </div>
            {filteredCharts.length > 0 ? (
                <div className="gallery-grid">
                    {filteredCharts.map((chart) => (
                        <ChartCard key={chart.id} chart={chart} onDelete={deleteChart} />
                    ))}
                </div>
            ) : (
                <div className="gallery-empty">
                    <div className="gallery-empty-content">
                        <LayoutGrid size={48} />
                        <h3>No charts yet</h3>
                        <p>Paste a screenshot (Ctrl+V) or click "New Chart" to get started</p>
                        <button className="btn btn-primary btn-lg" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} /> Add Your First Chart
                        </button>
                    </div>
                </div>
            )}

            <AddChartModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setPastedImage(null);
                }}
                initialImage={pastedImage}
                defaultProjectId={filterProject !== 'all' ? filterProject : undefined}
                defaultThemeId={filterTheme !== 'all' ? filterTheme : undefined}
            />
        </div>
    );
}
