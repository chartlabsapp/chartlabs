// AddChartModal Component
import { useState, useEffect, useCallback } from 'react';
import { X, Clipboard, Upload, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import './AddChartModal.css';

interface AddChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialImage?: Blob | null;
    defaultProjectId?: string;
    defaultThemeId?: string;
}

export default function AddChartModal({
    isOpen,
    onClose,
    initialImage,
    defaultProjectId,
    defaultThemeId
}: AddChartModalProps) {
    const { state, addChart, addTheme, deleteTheme } = useStore();
    const { config, projects, themes, charts } = state;

    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (defaultProjectId) setProjectId(defaultProjectId);
            if (defaultThemeId) setThemeId(defaultThemeId);

            if (initialImage) {
                setImageBlob(initialImage);
                setImagePreview(URL.createObjectURL(initialImage));
            }
        }
    }, [isOpen, initialImage, defaultProjectId, defaultThemeId]);
    const [symbol, setSymbol] = useState(config.symbols[0] || '');
    const [timeframe, setTimeframe] = useState(config.timeframes[4] || 'H1');
    const [session, setSession] = useState('');
    const [direction, setDirection] = useState<'long' | 'short' | undefined>(undefined);
    const [setupName, setSetupName] = useState('');
    const [projectId, setProjectId] = useState(projects[0]?.id || 'default');
    const [themeId, setThemeId] = useState<string>('');
    const [newThemeName, setNewThemeName] = useState('');
    const [showNewThemeInput, setShowNewThemeInput] = useState(false);
    const [tradingDay, setTradingDay] = useState(new Date().toISOString().split('T')[0]);

    // Smart Pre-fill: When project changes, find the last chart added to this project
    useEffect(() => {
        const projectCharts = charts.filter(c => c.projectId === projectId);
        if (projectCharts.length > 0) {
            // Sort by createdAt descending to get the latest
            const lastChart = [...projectCharts].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            setSymbol(lastChart.symbol);
            setTimeframe(lastChart.timeframe);
            setSession(lastChart.session);
            setTradingDay(lastChart.tradingDay);
            // We keep themeId empty or set it to last one? 
            // User said "first interaction on that project fill from scratch", 
            // but implies once started, keep them. 
            // Let's keep themeId if it belongs to the project.
            if (lastChart.themeId) setThemeId(lastChart.themeId);
        }
    }, [projectId, charts]);
    const [outcome, setOutcome] = useState<'win' | 'loss' | 'breakeven' | undefined>(undefined);
    const [riskReward, setRiskReward] = useState<string>('');
    const [pnl, setPnl] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (!isOpen) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    setImageBlob(blob);
                    setImagePreview(URL.createObjectURL(blob));
                }
            }
        }
    }, [isOpen]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageBlob(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageBlob(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!imageBlob) return;
        setLoading(true);
        try {
            await addChart(imageBlob, {
                symbol,
                timeframe,
                session,
                direction,
                setupName,
                projectId,
                themeId: themeId || undefined,
                tradingDay,
                outcome,
                riskReward: riskReward ? parseFloat(riskReward) : undefined,
                pnl: pnl ? parseFloat(pnl) : undefined,
                tags,
                notes,
                annotations: undefined,
            });
            handleClose();
        } catch (err) {
            console.error('Failed to save chart:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setImageBlob(null);
        setImagePreview(null);
        setSetupName('');
        setOutcome(undefined);
        setRiskReward('');
        setPnl('');
        setTags([]);
        setNotes('');
        onClose();
    };

    const toggleTag = (tag: string) => {
        setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal add-chart-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add Chart</h3>
                    <button className="btn btn-icon btn-ghost" onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Image Area */}
                    <div
                        className={`paste-area ${isDragging ? 'dragging' : ''} ${imagePreview ? 'has-image' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {imagePreview ? (
                            <div className="paste-preview">
                                <img src={imagePreview} alt="Chart preview" />
                                <button className="btn btn-sm btn-secondary paste-clear" onClick={() => { setImageBlob(null); setImagePreview(null); }}>
                                    Change Image
                                </button>
                            </div>
                        ) : (
                            <div className="paste-prompt">
                                <Clipboard size={32} />
                                <p><strong>Ctrl+V</strong> to paste a screenshot</p>
                                <p className="text-secondary">or drag & drop an image file</p>
                                <label className="btn btn-sm btn-secondary upload-btn">
                                    <Upload size={14} /> Choose File
                                    <input type="file" accept="image/*" onChange={handleFileInput} hidden />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <div className="add-chart-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Symbol</label>
                                <select className="select" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                                    {config.symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Timeframe</label>
                                <select className="select" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                                    {config.timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Session</label>
                                <select className="select" value={session} onChange={(e) => setSession(e.target.value)}>
                                    <option value="">None</option>
                                    {config.sessions.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Direction</label>
                                <div className="toggle-group">
                                    <button className={`toggle-btn ${direction === 'long' ? 'active long' : ''}`} onClick={() => setDirection(direction === 'long' ? undefined : 'long')}>Long</button>
                                    <button className={`toggle-btn ${direction === 'short' ? 'active short' : ''}`} onClick={() => setDirection(direction === 'short' ? undefined : 'short')}>Short</button>
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Setup Name</label>
                                <input className="input" value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="e.g. BOS + FVG" />
                            </div>
                            <div className="form-group">
                                <label className="label">Trading Day</label>
                                <input className="input" type="date" value={tradingDay} onChange={(e) => setTradingDay(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Project</label>
                                <select className="select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setThemeId(''); }}>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Theme / Sub-folder (Optional)</label>
                                <div className="theme-selector">
                                    {showNewThemeInput ? (
                                        <div className="flex gap-2">
                                            <input
                                                className="input"
                                                value={newThemeName}
                                                onChange={(e) => setNewThemeName(e.target.value)}
                                                placeholder="New theme name..."
                                                autoFocus
                                            />
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    if (newThemeName.trim()) {
                                                        const c = addTheme(projectId, newThemeName.trim());
                                                        setThemeId(c.id);
                                                        setNewThemeName('');
                                                        setShowNewThemeInput(false);
                                                    }
                                                }}
                                            >
                                                Add
                                            </button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setShowNewThemeInput(false)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <select className="select flex-grow" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
                                                <option value="">None</option>
                                                {themes.filter(c => c.projectId === projectId).map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {themeId && (
                                                <button
                                                    className="btn btn-sm btn-ghost btn-danger-ghost"
                                                    onClick={() => {
                                                        if (confirm('Delete this theme? Charts using it will be unlinked.')) {
                                                            deleteTheme(themeId);
                                                            setThemeId('');
                                                        }
                                                    }}
                                                    title="Delete selected theme"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <button className="btn btn-sm btn-secondary" onClick={() => setShowNewThemeInput(true)}>New</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Outcome (optional)</label>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${outcome === 'win' ? 'active long' : ''}`} onClick={() => setOutcome(outcome === 'win' ? undefined : 'win')}>Win</button>
                                <button className={`toggle-btn ${outcome === 'loss' ? 'active short' : ''}`} onClick={() => setOutcome(outcome === 'loss' ? undefined : 'loss')}>Loss</button>
                                <button className={`toggle-btn ${outcome === 'breakeven' ? 'active neutral' : ''}`} onClick={() => setOutcome(outcome === 'breakeven' ? undefined : 'breakeven')}>BE</button>
                            </div>
                        </div>

                        {outcome && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label">R:R (optional)</label>
                                    <input className="input" type="number" step="0.1" value={riskReward} onChange={(e) => setRiskReward(e.target.value)} placeholder="e.g. 2.5" />
                                </div>
                                <div className="form-group">
                                    <label className="label">P&L (optional)</label>
                                    <input className="input" type="number" step="0.01" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="e.g. 150.00" />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label">Tags</label>
                            <div className="tag-picker">
                                {config.commonTags.map((tag) => (
                                    <button
                                        key={tag}
                                        className={`chip ${tags.includes(tag) ? 'chip-selected' : ''}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Notes</label>
                            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trade notes, observations, lessons..." rows={3} />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!imageBlob || loading}>
                        {loading ? 'Saving...' : 'Save Chart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
