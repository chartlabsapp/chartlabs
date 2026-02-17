// WorkspacePage — Chart Viewer + Trade Details
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trash2, ChevronDown, ChevronRight, Plus, X, Save, ArrowLeft
} from 'lucide-react';
import { useStore } from '../store';
import { readChartImage } from '../lib/fileSystem';
import './WorkspacePage.css';





export default function WorkspacePage() {
    const { chartId } = useParams();
    const navigate = useNavigate();
    const store = useStore();
    const { state, activeDirectoryHandle, updateChart, deleteChart, addSecondaryImage } = store;
    const { charts, projects, themes, config } = state;

    const chart = charts.find((c) => c.id === chartId);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [activeImageFile, setActiveImageFile] = useState<string | null>(null);
    const [secondaryPreviews, setSecondaryPreviews] = useState<Record<string, string>>({});

    // Form state (local, synced on save)
    const [symbol, setSymbol] = useState('');
    const [timeframe, setTimeframe] = useState('');
    const [session, setSession] = useState('');
    const [direction, setDirection] = useState<'long' | 'short' | undefined>();
    const [setupName, setSetupName] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [outcome, setOutcome] = useState<'win' | 'loss' | 'breakeven' | undefined>();
    const [pnl, setPnl] = useState('');
    const [riskReward, setRiskReward] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [projectId, setProjectId] = useState('default');
    const [themeId, setThemeId] = useState<string>('');
    const [tradingDay, setTradingDay] = useState('');

    const [riskOpen, setRiskOpen] = useState(true);
    const [outcomeOpen, setOutcomeOpen] = useState(true);

    // Load chart data
    useEffect(() => {
        if (chart) {
            setSymbol(chart.symbol);
            setTimeframe(chart.timeframe);
            setSession(chart.session);
            setDirection(chart.direction);
            setSetupName(chart.setupName);
            setEntryPrice(chart.entryPrice?.toString() || '');
            setStopLoss(chart.stopLoss?.toString() || '');
            setTakeProfit(chart.takeProfit?.toString() || '');
            setOutcome(chart.outcome);
            setPnl(chart.pnl?.toString() || '');
            setRiskReward(chart.riskReward?.toString() || '');
            setTags(chart.tags);
            setNotes(chart.notes);
            setProjectId(chart.projectId);
            setThemeId(chart.themeId || '');
            setTradingDay(chart.tradingDay);
        }
    }, [chart]);

    // Load main chart image or active secondary image
    useEffect(() => {
        if (chart && activeDirectoryHandle) {
            const fileToLoad = activeImageFile || chart.imageFileName;
            readChartImage(activeDirectoryHandle, fileToLoad).then((url) => {
                if (url) setImageUrl(url);
                else if (!activeImageFile && chart.thumbnailDataUrl) setImageUrl(chart.thumbnailDataUrl);
            });
        } else if (!activeImageFile && chart?.thumbnailDataUrl) {
            setImageUrl(chart.thumbnailDataUrl);
        }
    }, [chart, activeDirectoryHandle, activeImageFile]);

    // Preload thumbnails for secondary images
    useEffect(() => {
        if (chart?.secondaryImages && activeDirectoryHandle) {
            chart.secondaryImages.forEach(file => {
                if (!secondaryPreviews[file]) {
                    readChartImage(activeDirectoryHandle!, file).then(url => {
                        if (url) setSecondaryPreviews(prev => ({ ...prev, [file]: url }));
                    });
                }
            });
        }
    }, [chart?.secondaryImages, activeDirectoryHandle]);



    // Auto-calc R:R
    useEffect(() => {
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = parseFloat(takeProfit);
        if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && entry !== sl) {
            const risk = Math.abs(entry - sl);
            const reward = Math.abs(tp - entry);
            if (risk > 0) setRiskReward((reward / risk).toFixed(2));
        }
    }, [entryPrice, stopLoss, takeProfit]);

    const handleSave = useCallback(() => {
        if (!chart) return;

        updateChart(chart.id, {
            symbol, timeframe, session, direction, setupName,
            entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
            stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
            takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
            riskReward: riskReward ? parseFloat(riskReward) : undefined,
            outcome, pnl: pnl ? parseFloat(pnl) : undefined,
            tags, notes, projectId, themeId: themeId || undefined, tradingDay,
        });
    }, [chart, symbol, timeframe, session, direction, setupName, entryPrice, stopLoss, takeProfit, riskReward, outcome, pnl, tags, notes, projectId, themeId, tradingDay, updateChart]);

    const handleDelete = async () => {
        if (!chart) return;
        if (confirm('Delete this chart permanently?')) {
            await deleteChart(chart.id);
            navigate('/');
        }
    };

    const removeSecondaryImage = async (fileName: string) => {
        if (!chart || !activeDirectoryHandle) return;
        if (confirm('Delete this screenshot?')) {
            try {
                const chartsDir = await activeDirectoryHandle.getDirectoryHandle('charts');
                await chartsDir.removeEntry(fileName);
                const updated = chart.secondaryImages?.filter(f => f !== fileName) || [];
                updateChart(chart.id, { secondaryImages: updated });
                if (activeImageFile === fileName) setActiveImageFile(null);
            } catch (err) {
                console.error('Failed to delete screenshot:', err);
            }
        }
    };

    const toggleTag = (tag: string) => {
        setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    };

    // Handle paste to add secondary image
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        if (!chart) return;

        // Don't trigger if user is typing in notes/input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    try {
                        const fileName = await addSecondaryImage(chart.id, blob);
                        setActiveImageFile(fileName);
                    } catch (err) {
                        console.error('Failed to paste chart:', err);
                    }
                }
            }
        }
    }, [chart, addSecondaryImage]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);



    if (!chart) {
        return (
            <div className="workspace-empty">
                <h3>Select a chart from the gallery</h3>
                <p>or paste a new chart screenshot</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Gallery</button>
            </div>
        );
    }



    return (
        <div className="workspace-page">
            <div className="workspace-nav">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft size={14} /> Back to Gallery
                </button>
            </div>
            {/* Left: Chart Viewer + Annotations */}
            <div className="workspace-chart-panel">
                <div className="workspace-chart-header">
                    <span className="badge badge-accent">{chart.symbol}</span>
                    <span className="chart-card-tf">{chart.timeframe}</span>
                    <span className="text-secondary">{chart.tradingDay}</span>
                </div>

                <div className="workspace-viewer">
                    {imageUrl ? (
                        <div className="viewer-image-container">
                            <img src={imageUrl} alt="Chart" className="viewer-image" />
                        </div>
                    ) : (
                        <div className="viewer-loading">Loading chart image...</div>
                    )}
                </div>
            </div>

            {/* Right: Trade Details Form */}
            <div className="workspace-details-panel">
                <div className="workspace-details-scroll">
                    {/* Trade Details Section */}
                    <div className="form-section">
                        <div className="form-section-title">Trade Details</div>
                        <div className="form-group">
                            <label className="label">Symbol</label>
                            <select className="select" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                                {config.symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Timeframe</label>
                                <select className="select" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                                    {config.timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Session</label>
                                <select className="select" value={session} onChange={(e) => setSession(e.target.value)}>
                                    <option value="">None</option>
                                    {config.sessions.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Direction</label>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${direction === 'long' ? 'active long' : ''}`} onClick={() => setDirection(direction === 'long' ? undefined : 'long')}>Long</button>
                                <button className={`toggle-btn ${direction === 'short' ? 'active short' : ''}`} onClick={() => setDirection(direction === 'short' ? undefined : 'short')}>Short</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Setup Name</label>
                            <input className="input" value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="e.g. BOS + FVG" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Project</label>
                                <select className="select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setThemeId(''); }}>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Theme</label>
                                <select className="select" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
                                    <option value="">None</option>
                                    {themes.filter(c => c.projectId === projectId).map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Trading Day</label>
                            <input className="input" type="date" value={tradingDay} onChange={(e) => setTradingDay(e.target.value)} />
                        </div>
                    </div>

                    {/* Risk Management Section */}
                    <div className="form-section">
                        <div className="form-section-title" onClick={() => setRiskOpen(!riskOpen)}>
                            {riskOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Risk Management
                        </div>
                        {riskOpen && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="label">Entry</label>
                                        <input className="input" type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Stop Loss</label>
                                        <input className="input" type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="label">Take Profit</label>
                                        <input className="input" type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">R:R</label>
                                        <div className="rr-display">{riskReward || '—'}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Outcome Section */}
                    <div className="form-section">
                        <div className="form-section-title" onClick={() => setOutcomeOpen(!outcomeOpen)}>
                            {outcomeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Outcome
                        </div>
                        {outcomeOpen && (
                            <>
                                <div className="form-group">
                                    <div className="toggle-group">
                                        <button className={`toggle-btn ${outcome === 'win' ? 'active long' : ''}`} onClick={() => setOutcome(outcome === 'win' ? undefined : 'win')}>Win</button>
                                        <button className={`toggle-btn ${outcome === 'loss' ? 'active short' : ''}`} onClick={() => setOutcome(outcome === 'loss' ? undefined : 'loss')}>Loss</button>
                                        <button className={`toggle-btn ${outcome === 'breakeven' ? 'active neutral' : ''}`} onClick={() => setOutcome(outcome === 'breakeven' ? undefined : 'breakeven')}>BE</button>
                                    </div>
                                </div>
                                {outcome && (
                                    <div className="form-group">
                                        <label className="label">P&L (optional)</label>
                                        <input className="input" type="number" step="0.01" value={pnl} onChange={(e) => setPnl(e.target.value)} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Tags & Notes */}
                    <div className="form-section">
                        <div className="form-section-title">Tags & Notes</div>
                        <div className="form-group">
                            <div className="tag-picker">
                                {config.commonTags.map((tag) => (
                                    <button key={tag} className={`chip ${tags.includes(tag) ? 'chip-selected' : ''}`} onClick={() => toggleTag(tag)}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows={4} />
                        </div>
                    </div>

                    {/* Secondary Images Section */}
                    <div className="form-section">
                        <div className="form-section-title">Screenshots</div>
                        <div className="secondary-images-grid">
                            <div
                                className={`secondary-image-item ${!activeImageFile ? 'active' : ''}`}
                                onClick={() => setActiveImageFile(null)}
                            >
                                <img src={chart.thumbnailDataUrl || imageUrl || ''} alt="Main" />
                                <span className="image-label">Main</span>
                            </div>
                            {chart.secondaryImages?.map((file, i) => (
                                <div
                                    key={file}
                                    className={`secondary-image-item ${activeImageFile === file ? 'active' : ''}`}
                                    onClick={() => setActiveImageFile(file)}
                                >
                                    <img src={secondaryPreviews[file] || ''} alt={`Secondary ${i + 1}`} />
                                    <button
                                        className="secondary-image-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeSecondaryImage(file);
                                        }}
                                    >
                                        <X size={10} />
                                    </button>
                                    <span className="image-label">#{i + 1}</span>
                                </div>
                            ))}
                            <label className="secondary-image-add">
                                <Plus size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file && chart) {
                                            try {
                                                const fileName = await addSecondaryImage(chart.id, file);
                                                setActiveImageFile(fileName);
                                            } catch (err) {
                                                console.error('Failed to add screenshot:', err);
                                            }
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="workspace-actions">
                        <button className="btn btn-primary w-full" onClick={handleSave}>
                            <Save size={16} /> Save
                        </button>
                        <button className="btn btn-danger" onClick={handleDelete}>
                            <Trash2 size={14} /> Delete Chart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
