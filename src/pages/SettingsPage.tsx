// SettingsPage — Configuration & Data Management
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, Download, Upload, Trash2, HardDrive, FileSpreadsheet,
    ArrowLeft, Check, X, Sun, Moon
} from 'lucide-react';
import { useStore, useAnalytics } from '../store';
import { exportAsZip, importFromZip } from '../lib/fileSystem';
import { convertTradesToCSV, convertAnalyticsToCSV, downloadCSV } from '../lib/exportUtils';
import EditableChipList from '../components/ui/EditableChipList';
import './SettingsPage.css';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { state, activeDirectoryHandle, addFolder, removeFolder, setActiveFolder, addProject, deleteProject, updateConfig } = useStore();
    const { config, projects, charts, storageFolders, activeFolderId } = state;

    const [newProjectName, setNewProjectName] = useState('');
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(
        () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    );
    const analytics = useAnalytics();

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('btpro_theme', next);
    };

    const handleAddFolder = async () => {
        await addFolder();
    };

    const handleRemoveFolder = (id: string) => {
        if (confirm('Remove this folder from the list? (No files will be deleted.)')) {
            removeFolder(id);
        }
    };

    const handleExport = async () => {
        if (!activeDirectoryHandle) {
            alert('Please link a folder first in Storage settings above.');
            return;
        }
        setExporting(true);
        try {
            const blob = await exportAsZip(activeDirectoryHandle);
            const { saveAs } = await import('file-saver');
            saveAs(blob, `backtestpro-backup-${new Date().toISOString().split('T')[0]}.zip`);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const handleExportTradesCSV = () => {
        const csv = convertTradesToCSV(state.charts, state);
        downloadCSV(`trades_export_${new Date().toISOString().split('T')[0]}.csv`, csv);
    };

    const handleExportAnalyticsCSV = () => {
        const csv = convertAnalyticsToCSV(analytics);
        downloadCSV(`analytics_export_${new Date().toISOString().split('T')[0]}.csv`, csv);
    };

    const handleImport = async () => {
        if (!activeDirectoryHandle) {
            alert('Please link a folder first in Storage settings above.');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            setImporting(true);
            try {
                const count = await importFromZip(activeDirectoryHandle, file);
                alert(`Imported ${count} chart(s). Refresh to see changes.`);
            } catch (err) {
                console.error('Import failed:', err);
            } finally {
                setImporting(false);
            }
        };
        input.click();
    };

    const handleAddProject = () => {
        const name = newProjectName.trim();
        if (name) {
            addProject(name);
            setNewProjectName('');
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-nav">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="save-status">
                    <Check size={14} className="text-secondary" />
                    <span className="text-secondary text-xs">Auto-saved to folder</span>
                </div>
            </div>
            <h2 className="settings-title">Settings</h2>

            {/* Appearance */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    <h3>Appearance</h3>
                </div>
                <p className="text-secondary">Switch between dark and light mode.</p>
                <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <span className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
                        <Moon size={14} /> Dark
                    </span>
                    <span className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
                        <Sun size={14} /> Light
                    </span>
                </button>
            </div>

            {/* Storage Section */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <HardDrive size={18} />
                    <h3>Storage</h3>
                </div>
                <p className="text-secondary">
                    Link one or more local folders to store chart images and data. Click a folder to make it the active storage target.
                </p>

                {storageFolders.length > 0 && (
                    <div className="folder-list">
                        {storageFolders.map((folder) => (
                            <div
                                key={folder.id}
                                className={`folder-item ${folder.id === activeFolderId ? 'active' : ''}`}
                                onClick={() => setActiveFolder(folder.id)}
                            >
                                <FolderOpen size={16} className="folder-icon" />
                                <span className="folder-name">{folder.name}</span>
                                {folder.id === activeFolderId && (
                                    <span className="folder-badge">Active</span>
                                )}
                                <button
                                    className="btn btn-icon btn-ghost btn-sm folder-remove"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveFolder(folder.id); }}
                                    title="Remove folder"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-secondary" onClick={handleAddFolder}>
                    <FolderOpen size={14} /> Add Folder
                </button>

                {storageFolders.length === 0 && (
                    <div className="storage-status">
                        <div className="storage-indicator">
                            No folders linked
                        </div>
                    </div>
                )}
            </div>

            {/* Data Management */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <Download size={18} />
                    <h3>Data Management</h3>
                </div>
                <p className="text-secondary">
                    Export all your charts and settings as a portable ZIP, or import from a backup.
                </p>
                <div className="settings-card-actions">
                    <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                        <Download size={14} /> {exporting ? 'Exporting...' : 'Complete ZIP Backup'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportTradesCSV}>
                        <FileSpreadsheet size={14} /> Export Trades CSV
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportAnalyticsCSV}>
                        <FileSpreadsheet size={14} /> Export Analytics CSV
                    </button>
                    <button className="btn btn-ghost" onClick={handleImport} disabled={importing}>
                        <Upload size={14} /> {importing ? 'Importing...' : 'Import from ZIP'}
                    </button>
                </div>
            </div>

            {/* Projects */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>Projects</h3>
                </div>
                <div className="project-list">
                    {projects.map((p) => (
                        <div key={p.id} className="project-item">
                            <span className="project-name">{p.name}</span>
                            <span className="text-secondary text-xs">
                                {charts.filter((c) => c.projectId === p.id).length} charts
                            </span>
                            {p.id !== 'default' && (
                                <button className="btn btn-icon btn-ghost btn-danger-ghost" onClick={() => deleteProject(p.id)}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="add-project-row">
                    <input
                        className="input"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="New project name"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAddProject} disabled={!newProjectName.trim()}>
                        Add
                    </button>
                </div>
            </div>

            {/* Symbols */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>Symbols</h3>
                </div>
                <EditableChipList
                    items={config.symbols}
                    onChange={(symbols) => updateConfig({ symbols })}
                    placeholder="e.g. AAPL"
                />
            </div>

            {/* Timeframes */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>Timeframes</h3>
                </div>
                <EditableChipList
                    items={config.timeframes}
                    onChange={(timeframes) => updateConfig({ timeframes })}
                    placeholder="e.g. H4"
                />
            </div>

            {/* Sessions */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>Trading Sessions</h3>
                </div>
                <EditableChipList
                    items={config.sessions}
                    onChange={(sessions) => updateConfig({ sessions })}
                    placeholder="e.g. London"
                />
            </div>

            {/* Tags */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>Common Tags</h3>
                </div>
                <EditableChipList
                    items={config.commonTags}
                    onChange={(commonTags) => updateConfig({ commonTags })}
                    placeholder="e.g. A+ Setup"
                />
            </div>

            {/* File Naming */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <h3>File Naming Template</h3>
                </div>
                <p className="text-secondary" style={{ marginBottom: 8 }}>
                    Available tokens: <code>{'{symbol}'}</code> <code>{'{timeframe}'}</code> <code>{'{session}'}</code> <code>{'{date}'}</code> <code>{'{outcome}'}</code> <code>{'{project}'}</code> <code>{'{theme}'}</code>
                </p>
                <input
                    className="input"
                    value={config.fileNameTemplate}
                    onChange={(e) => updateConfig({ fileNameTemplate: e.target.value })}
                    placeholder="{symbol}_{timeframe}_{session}_{date}_{outcome}"
                />
                <div className="template-preview">
                    Preview: <code>{config.fileNameTemplate
                        .replace('{symbol}', 'EURUSD')
                        .replace('{timeframe}', 'H1')
                        .replace('{session}', 'London')
                        .replace('{date}', '2025-01-15')
                        .replace('{outcome}', 'win')
                        .replace('{project}', 'Main')
                        .replace('{theme}', 'Setup-A')}.png</code>
                </div>
            </div>
        </div>
    );
}
