// SettingsPage — Configuration & Data Management
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, Download, Upload, Trash2, HardDrive, FileSpreadsheet,
    ArrowLeft, Check, X, Sun, Moon, LogIn, LogOut, Heart, Coffee, ExternalLink
} from 'lucide-react';
import { useStore, useAnalytics } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { exportAsZip, importFromZip } from '../lib/fileSystem';
import { convertTradesToCSV, convertAnalyticsToCSV, downloadCSV } from '../lib/exportUtils';
import EditableChipList from '../components/ui/EditableChipList';
import './SettingsPage.css';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { state, activeDirectoryHandle, addFolder, removeFolder, setActiveFolder, addProject, deleteProject, updateConfig, reconnectFolder } = useStore();
    const { user, signIn, signUp, signOut } = useAuth();
    const { config, projects, charts, storageFolders, activeFolderId } = state;

    const [newProjectName, setNewProjectName] = useState('');
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(
        () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    );
    const analytics = useAnalytics();

    // Auth form state
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSubmitting, setAuthSubmitting] = useState(false);

    const handleAuth = async () => {
        setAuthError(null);
        setAuthSubmitting(true);
        const fn = authMode === 'login' ? signIn : signUp;
        const { error } = await fn(authEmail, authPassword);
        if (error) setAuthError(error);
        else {
            setAuthEmail('');
            setAuthPassword('');
        }
        setAuthSubmitting(false);
    };

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

            {/* Account */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <LogIn size={18} />
                    <h3>Account</h3>
                </div>
                {user ? (
                    <div className="auth-signed-in">
                        <div className="auth-user-info">
                            <div className="auth-avatar">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="auth-user-email">{user.email}</div>
                                <div className="text-secondary text-xs">Signed in</div>
                            </div>
                        </div>
                        <button className="btn btn-ghost auth-signout-btn" onClick={signOut}>
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="auth-form">
                        <p className="text-secondary" style={{ marginBottom: 12 }}>
                            Sign in to sync your settings and data across devices.
                        </p>
                        <div className="auth-mode-toggle">
                            <button
                                className={`auth-mode-btn ${authMode === 'login' ? 'active' : ''}`}
                                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                            >
                                Sign In
                            </button>
                            <button
                                className={`auth-mode-btn ${authMode === 'signup' ? 'active' : ''}`}
                                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                            >
                                Create Account
                            </button>
                        </div>
                        <input
                            className="input"
                            type="email"
                            placeholder="Email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                        <input
                            className="input"
                            type="password"
                            placeholder="Password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                        {authError && <div className="auth-error">{authError}</div>}
                        <button
                            className="btn btn-primary"
                            onClick={handleAuth}
                            disabled={authSubmitting || !authEmail || !authPassword}
                        >
                            {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>
                )}
            </div>

            {/* Support */}
            <div className="card settings-section support-section">
                <div className="settings-section-header">
                    <Heart size={18} className="text-red" />
                    <h3>Support ChartLabs</h3>
                </div>
                <p className="text-secondary">
                    ChartLabs is free to use. If you find it helpful, consider buying me a coffee to support ongoing development!
                </p>
                <a
                    href="https://ko-fi.com/chartlabs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-kofi"
                >
                    <Coffee size={16} /> Support on Ko-fi <ExternalLink size={12} />
                </a>
            </div>

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
                                className={`folder-item ${folder.id === activeFolderId ? 'active' : ''} ${folder.isConnected === false ? 'disconnected' : ''}`}
                                onClick={() => folder.isConnected !== false && setActiveFolder(folder.id)}
                            >
                                <FolderOpen size={16} className="folder-icon" />
                                <div className="folder-info">
                                    <span className="folder-name">{folder.name}</span>
                                    {folder.isConnected === false && (
                                        <span className="folder-status-badge disconnected">Disconnected</span>
                                    )}
                                </div>
                                {folder.id === activeFolderId && folder.isConnected !== false && (
                                    <span className="folder-badge">Active</span>
                                )}

                                <div className="folder-actions">
                                    {folder.isConnected === false && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={(e) => { e.stopPropagation(); reconnectFolder(folder.id); }}
                                        >
                                            Reconnect
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-icon btn-ghost btn-sm folder-remove"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFolder(folder.id); }}
                                        title="Remove folder"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
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
