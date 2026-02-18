// ============================================
// BacktestPro — Global State Store (React Context)
// ============================================

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
    Chart, Project, Theme, TimerSession, AppConfig, AppState, StorageFolder, OverallStats,
    SymbolStats, TimeframeStats, RRBucket, ProjectTimeStats
} from './types';
import { DEFAULT_CONFIG, DEFAULT_PROJECT } from './types';
import {
    saveJSON, readJSON, saveChartImage, saveChartMetadata,
    deleteChartFiles, generateThumbnail, buildFileName,
    loadAllChartMetadata, pickDirectory
} from './lib/fileSystem';
import { saveHandles, loadHandles, clearHandles } from './lib/handleStore';

// --- Actions ---
type Action =
    | { type: 'SET_STATE'; payload: Partial<AppState> }
    | { type: 'ADD_CHART'; payload: Chart }
    | { type: 'UPDATE_CHART'; payload: { id: string; updates: Partial<Chart> } }
    | { type: 'DELETE_CHART'; payload: string }
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'ADD_THEME'; payload: Theme }
    | { type: 'UPDATE_THEME'; payload: { id: string; updates: Partial<Theme> } }
    | { type: 'DELETE_THEME'; payload: string }
    | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfig> }
    | { type: 'ADD_TIMER_SESSION'; payload: TimerSession }
    | { type: 'UPDATE_TIMER_SESSION'; payload: { id: string; updates: Partial<TimerSession> } }
    | { type: 'DELETE_TIMER_SESSION'; payload: string }
    | { type: 'ADD_FOLDER'; payload: StorageFolder }
    | { type: 'REMOVE_FOLDER'; payload: string }
    | { type: 'SET_ACTIVE_FOLDER'; payload: string };

const initialState: AppState = {
    charts: [],
    projects: [DEFAULT_PROJECT],
    themes: [],
    config: {
        ...DEFAULT_CONFIG,
        symbols: [...DEFAULT_CONFIG.symbols].sort(),
        timeframes: [...DEFAULT_CONFIG.timeframes].sort(),
        sessions: [...DEFAULT_CONFIG.sessions].sort(),
        commonTags: [...DEFAULT_CONFIG.commonTags].sort(),
    },
    timerSessions: [],
    storageFolders: [],
    activeFolderId: null,
    initialized: false,
};

// Helper to get the active directory handle from state
function getActiveHandle(state: AppState): FileSystemDirectoryHandle | null {
    if (!state.activeFolderId) return null;
    const folder = state.storageFolders.find(f => f.id === state.activeFolderId);
    return folder?.handle ?? null;
}

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_STATE':
            return {
                ...state,
                ...action.payload,
                projects: action.payload.projects ? [...action.payload.projects].sort((a, b) => a.name.localeCompare(b.name)) : state.projects,
                themes: action.payload.themes ? [...action.payload.themes].sort((a, b) => a.name.localeCompare(b.name)) : state.themes,
                config: action.payload.config ? {
                    ...action.payload.config,
                    symbols: [...(action.payload.config.symbols || [])].sort(),
                    timeframes: [...(action.payload.config.timeframes || [])].sort(),
                    sessions: [...(action.payload.config.sessions || [])].sort(),
                    commonTags: [...(action.payload.config.commonTags || [])].sort(),
                } : state.config
            };
        case 'ADD_CHART':
            return { ...state, charts: [action.payload, ...state.charts] };
        case 'UPDATE_CHART':
            return {
                ...state,
                charts: state.charts.map((c) =>
                    c.id === action.payload.id ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() } : c
                ),
            };
        case 'DELETE_CHART':
            return { ...state, charts: state.charts.filter((c) => c.id !== action.payload) };
        case 'ADD_PROJECT':
            return {
                ...state,
                projects: [...state.projects, action.payload].sort((a, b) => a.name.localeCompare(b.name))
            };
        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: state.projects.map((p) =>
                    p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
                ).sort((a, b) => a.name.localeCompare(b.name)),
            };
        case 'DELETE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter((p) => p.id !== action.payload),
                themes: state.themes.filter((c) => c.projectId !== action.payload)
            };
        case 'ADD_THEME':
            return {
                ...state,
                themes: [...state.themes, action.payload].sort((a, b) => a.name.localeCompare(b.name))
            };
        case 'UPDATE_THEME':
            return {
                ...state,
                themes: state.themes.map((c) =>
                    c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
                ).sort((a, b) => a.name.localeCompare(b.name)),
            };
        case 'DELETE_THEME':
            return { ...state, themes: state.themes.filter((c) => c.id !== action.payload) };
        case 'UPDATE_CONFIG':
            const newConfig = { ...state.config, ...action.payload };
            return {
                ...state,
                config: {
                    ...newConfig,
                    symbols: [...(newConfig.symbols || [])].sort(),
                    timeframes: [...(newConfig.timeframes || [])].sort(),
                    sessions: [...(newConfig.sessions || [])].sort(),
                    commonTags: [...(newConfig.commonTags || [])].sort(),
                }
            };
        case 'ADD_TIMER_SESSION':
            return { ...state, timerSessions: [action.payload, ...state.timerSessions] };
        case 'UPDATE_TIMER_SESSION':
            return {
                ...state,
                timerSessions: state.timerSessions.map((s) =>
                    s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
                ),
            };
        case 'DELETE_TIMER_SESSION':
            return { ...state, timerSessions: state.timerSessions.filter((s) => s.id !== action.payload) };
        case 'ADD_FOLDER':
            return {
                ...state,
                storageFolders: [...state.storageFolders, action.payload],
                activeFolderId: action.payload.id,
            };
        case 'REMOVE_FOLDER': {
            const newFolders = state.storageFolders.filter(f => f.id !== action.payload);
            return {
                ...state,
                storageFolders: newFolders,
                activeFolderId: state.activeFolderId === action.payload
                    ? (newFolders.length > 0 ? newFolders[0].id : null)
                    : state.activeFolderId,
            };
        }
        case 'SET_ACTIVE_FOLDER':
            return { ...state, activeFolderId: action.payload };
        default:
            return state;
    }
}

// --- Context ---
interface StoreContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    activeDirectoryHandle: FileSystemDirectoryHandle | null;
    // Convenience actions
    initializeApp: () => Promise<void>;
    addFolder: () => Promise<StorageFolder | null>;
    removeFolder: (id: string) => void;
    setActiveFolder: (id: string) => void;
    reconnectFolder: (id: string) => Promise<boolean>;
    addChart: (imageBlob: Blob, metadata: Omit<Chart, 'id' | 'imageFileName' | 'thumbnailDataUrl' | 'createdAt' | 'updatedAt'>) => Promise<Chart>;
    addSecondaryImage: (id: string, imageBlob: Blob) => Promise<string>;
    updateChart: (id: string, updates: Partial<Chart>) => void;
    deleteChart: (id: string) => Promise<void>;
    addProject: (name: string, description?: string) => Project;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addTheme: (projectId: string, name: string, description?: string) => Theme;
    updateTheme: (id: string, updates: Partial<Theme>) => void;
    deleteTheme: (id: string) => void;
    updateConfig: (updates: Partial<AppConfig>) => void;
    addTimerSession: (session: Omit<TimerSession, 'id'>) => TimerSession;
    updateTimerSession: (id: string, updates: Partial<TimerSession>) => void;
    deleteTimerSession: (id: string) => void;
    persistAll: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// --- Provider ---
export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Derive active directory handle from state
    const activeDirectoryHandle = getActiveHandle(state);

    // Persist to file system whenever state changes
    const persistAll = useCallback(async () => {
        if (!activeDirectoryHandle) return;
        const dir = activeDirectoryHandle;
        try {
            await saveJSON(dir, 'config.json', state.config);
            await saveJSON(dir, 'projects.json', state.projects);
            await saveJSON(dir, 'themes.json', state.themes);
            await saveJSON(dir, 'timer-sessions.json', state.timerSessions);
            // Charts are saved individually via addChart, not in batch
            // But we also save a charts-index for quick loading
            const index = state.charts.map(({ thumbnailDataUrl, ...rest }) => ({
                ...rest,
                secondaryImages: rest.secondaryImages || []
            }));
            await saveJSON(dir, 'charts-index.json', index);
        } catch (err) {
            console.error('Failed to persist data:', err);
        }
    }, [activeDirectoryHandle, state.config, state.projects, state.timerSessions, state.charts]);

    // Auto-persist on meaningful changes
    useEffect(() => {
        if (!state.initialized || !activeDirectoryHandle) return;
        const timeout = setTimeout(() => persistAll(), 500);
        return () => clearTimeout(timeout);
    }, [state.charts, state.projects, state.themes, state.config, state.timerSessions, state.initialized, activeDirectoryHandle, persistAll]);

    const addFolderAction = useCallback(async () => {
        try {
            const handle = await pickDirectory();
            const folder: StorageFolder = {
                id: uuidv4(),
                name: handle.name,
                handle,
            };
            dispatch({ type: 'ADD_FOLDER', payload: folder });
            localStorage.setItem('btpro_hasFolder', 'true');
            // Persist handle list to IndexedDB
            const updatedFolders = [...state.storageFolders, folder];
            await saveHandles(updatedFolders);
            return folder;
        } catch {
            return null;
        }
    }, [state.storageFolders]);

    const removeFolderAction = useCallback(async (id: string) => {
        dispatch({ type: 'REMOVE_FOLDER', payload: id });
        const newFolders = state.storageFolders.filter(f => f.id !== id);
        await saveHandles(newFolders);

        // Update active folder ID in localStorage if removed
        if (state.activeFolderId === id) {
            const nextActiveId = newFolders.length > 0 ? newFolders[0].id : null;
            if (nextActiveId) {
                localStorage.setItem('btpro_activeFolderId', nextActiveId);
            } else {
                localStorage.removeItem('btpro_activeFolderId');
            }
        }

        // If no folders remain, clear the localStorage hint and DB
        if (newFolders.length === 0) {
            localStorage.removeItem('btpro_hasFolder');
            await clearHandles();
        }
    }, [state.storageFolders, state.activeFolderId]);

    const setActiveFolderAction = useCallback((id: string) => {
        dispatch({ type: 'SET_ACTIVE_FOLDER', payload: id });
        localStorage.setItem('btpro_activeFolderId', id);
    }, []);

    const loadFromDisk = useCallback(async (dir: FileSystemDirectoryHandle) => {
        const config = await readJSON<AppConfig>(dir, 'config.json');
        const projects = await readJSON<Project[]>(dir, 'projects.json');
        const themes = await readJSON<Theme[]>(dir, 'themes.json');
        const timerSessions = await readJSON<TimerSession[]>(dir, 'timer-sessions.json');
        const chartsIndex = await readJSON<Chart[]>(dir, 'charts-index.json');

        // Also check individual chart metadata
        let charts = chartsIndex || [];
        if (!chartsIndex || chartsIndex.length === 0) {
            const metaFiles = await loadAllChartMetadata(dir);
            charts = metaFiles as unknown as Chart[];
        }

        // Generate thumbnails for charts that don't have them
        // (we'll do this lazily in the gallery)

        dispatch({
            type: 'SET_STATE',
            payload: {
                config: config || DEFAULT_CONFIG,
                projects: projects && projects.length > 0 ? projects : [DEFAULT_PROJECT],
                themes: themes || [],
                timerSessions: timerSessions || [],
                charts: charts || [],
                initialized: true,
            },
        });
    }, []);

    const reconnectFolder = useCallback(async (id: string) => {
        const folder = state.storageFolders.find(f => f.id === id);
        if (!folder) return false;

        try {
            const status = await folder.handle.requestPermission({ mode: 'readwrite' });
            if (status === 'granted') {
                // Update folder connection state
                dispatch({
                    type: 'SET_STATE',
                    payload: {
                        storageFolders: state.storageFolders.map(f =>
                            f.id === id ? { ...f, isConnected: true } : f
                        )
                    }
                });
                // If this was the active folder, trigger a reload
                if (id === state.activeFolderId) {
                    loadFromDisk(folder.handle);
                }
                return true;
            }
        } catch (err) {
            console.error('Failed to reconnect folder:', err);
        }
        return false;
    }, [state.storageFolders, state.activeFolderId, loadFromDisk]);

    const initializeApp = useCallback(async () => {
        // Try to restore directory handles from IndexedDB
        const hasFolder = localStorage.getItem('btpro_hasFolder');
        if (!hasFolder) {
            dispatch({ type: 'SET_STATE', payload: { initialized: true } });
            return;
        }

        try {
            const savedFolders = await loadHandles();
            if (savedFolders.length === 0) {
                dispatch({ type: 'SET_STATE', payload: { initialized: true } });
                return;
            }

            // In some browsers, we can only re-grant permission on user gesture.
            // But we can check current status first.
            const folders: StorageFolder[] = [];
            for (const f of savedFolders) {
                // Check if we still have permission
                const status = await f.handle.queryPermission({ mode: 'readwrite' });
                if (status === 'granted') {
                    folders.push({ ...f, isConnected: true });
                } else {
                    folders.push({ ...f, isConnected: false });
                }
            }

            if (folders.length > 0) {
                const savedActiveId = localStorage.getItem('btpro_activeFolderId');
                const activeId = (savedActiveId && folders.find(f => f.id === savedActiveId))
                    ? savedActiveId
                    : folders[0].id;

                dispatch({
                    type: 'SET_STATE',
                    payload: {
                        storageFolders: folders,
                        activeFolderId: activeId
                    }
                });
                // Note: loading from disk happens via useEffect on activeDirectoryHandle
            }
        } catch (err) {
            console.error('Failed to restore folders:', err);
        }

        dispatch({ type: 'SET_STATE', payload: { initialized: true } });
    }, []);

    // Initialize app on mount
    useEffect(() => {
        initializeApp();
    }, [initializeApp]);


    // When active folder changes, load data from it
    useEffect(() => {
        if (activeDirectoryHandle) {
            loadFromDisk(activeDirectoryHandle);
        }
    }, [activeDirectoryHandle, loadFromDisk]);

    const addChart = useCallback(
        async (imageBlob: Blob, metadata: Omit<Chart, 'id' | 'imageFileName' | 'thumbnailDataUrl' | 'createdAt' | 'updatedAt'>) => {
            const id = uuidv4();
            const now = new Date().toISOString();
            const ext = imageBlob.type === 'image/png' ? 'png' : imageBlob.type === 'image/jpeg' ? 'jpg' : 'webp';

            const projectName = state.projects.find(p => p.id === metadata.projectId)?.name || 'General';
            const themeName = state.themes.find(t => t.id === metadata.themeId)?.name || 'Global';

            const baseName = buildFileName(state.config.fileNameTemplate, {
                symbol: metadata.symbol,
                timeframe: metadata.timeframe,
                session: metadata.session,
                date: metadata.tradingDay,
                outcome: metadata.outcome,
                setupName: metadata.setupName,
                project: projectName,
                theme: themeName,
            });
            const imageFileName = `${baseName}_${id.slice(0, 8)}.${ext}`;

            // Generate thumbnail
            const thumbnailDataUrl = await generateThumbnail(imageBlob);

            const chart: Chart = {
                ...metadata,
                id,
                imageFileName,
                thumbnailDataUrl,
                createdAt: now,
                updatedAt: now,
            };

            // Save to file system in charts/{project}/{theme}/
            if (activeDirectoryHandle) {
                await saveChartImage(activeDirectoryHandle, imageFileName, imageBlob, projectName, themeName);
                await saveChartMetadata(activeDirectoryHandle, imageFileName, chart as unknown as Record<string, unknown>, projectName, themeName);
            }

            dispatch({ type: 'ADD_CHART', payload: chart });
            return chart;
        },
        [activeDirectoryHandle, state.config.fileNameTemplate]
    );

    const addSecondaryImage = useCallback(
        async (chartId: string, imageBlob: Blob) => {
            const chart = state.charts.find(c => c.id === chartId);
            if (!chart || !activeDirectoryHandle) throw new Error('Chart or directory not found');

            const secProjectName = state.projects.find(p => p.id === chart.projectId)?.name || 'General';
            const secThemeName = state.themes.find(t => t.id === chart.themeId)?.name || 'Global';

            const id = uuidv4().slice(0, 8);
            const ext = imageBlob.type.split('/')[1] || 'png';
            const fileName = `${chart.imageFileName.split('.')[0]}_sec_${id}.${ext}`;

            await saveChartImage(activeDirectoryHandle, fileName, imageBlob, secProjectName, secThemeName);

            const updatedSecondaryImages = [...(chart.secondaryImages || []), fileName];
            dispatch({ type: 'UPDATE_CHART', payload: { id: chartId, updates: { secondaryImages: updatedSecondaryImages } } });

            return fileName;
        },
        [state.charts, state.projects, state.themes, activeDirectoryHandle]
    );

    const updateChart = useCallback((id: string, updates: Partial<Chart>) => {
        dispatch({ type: 'UPDATE_CHART', payload: { id, updates } });
    }, []);

    const deleteChartAction = useCallback(
        async (id: string) => {
            const chart = state.charts.find((c) => c.id === id);
            if (chart && activeDirectoryHandle) {
                const delProjectName = state.projects.find(p => p.id === chart.projectId)?.name || 'General';
                const delThemeName = state.themes.find(t => t.id === chart.themeId)?.name || 'Global';
                // Delete main image from charts/{project}/{theme}/
                await deleteChartFiles(activeDirectoryHandle, chart.imageFileName, delProjectName, delThemeName);
                // Delete secondary images from same subfolder
                if (chart.secondaryImages) {
                    for (const fileName of chart.secondaryImages) {
                        try {
                            await deleteChartFiles(activeDirectoryHandle, fileName, delProjectName, delThemeName);
                        } catch (err) {
                            console.warn(`Failed to delete secondary image ${fileName}:`, err);
                        }
                    }
                }
            }
            dispatch({ type: 'DELETE_CHART', payload: id });
        },
        [state.charts, state.projects, state.themes, activeDirectoryHandle]
    );

    const addProject = useCallback((name: string, description?: string) => {
        const project: Project = {
            id: uuidv4(),
            name,
            description,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_PROJECT', payload: project });
        return project;
    }, []);

    const updateProject = useCallback((id: string, updates: Partial<Project>) => {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
    }, []);

    const deleteProjectAction = useCallback((id: string) => {
        dispatch({ type: 'DELETE_PROJECT', payload: id });
    }, []);

    const addTheme = useCallback((projectId: string, name: string, description?: string) => {
        const theme: Theme = {
            id: uuidv4(),
            projectId,
            name,
            description,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_THEME', payload: theme });
        return theme;
    }, []);

    const updateTheme = useCallback((id: string, updates: Partial<Theme>) => {
        dispatch({ type: 'UPDATE_THEME', payload: { id, updates } });
    }, []);

    const deleteTheme = useCallback((id: string) => {
        dispatch({ type: 'DELETE_THEME', payload: id });
    }, []);

    const updateConfigAction = useCallback((updates: Partial<AppConfig>) => {
        dispatch({ type: 'UPDATE_CONFIG', payload: updates });
    }, []);

    const addTimerSessionAction = useCallback((session: Omit<TimerSession, 'id'>) => {
        const ts: TimerSession = { ...session, id: uuidv4() };
        dispatch({ type: 'ADD_TIMER_SESSION', payload: ts });
        return ts;
    }, []);

    const updateTimerSessionAction = useCallback((id: string, updates: Partial<TimerSession>) => {
        dispatch({ type: 'UPDATE_TIMER_SESSION', payload: { id, updates } });
    }, []);

    const deleteTimerSessionAction = useCallback((id: string) => {
        dispatch({ type: 'DELETE_TIMER_SESSION', payload: id });
    }, []);

    return (
        <StoreContext.Provider
            value={{
                state,
                dispatch,
                activeDirectoryHandle,
                initializeApp,
                addFolder: addFolderAction,
                removeFolder: removeFolderAction,
                setActiveFolder: setActiveFolderAction,
                reconnectFolder,
                addChart,
                addSecondaryImage,
                updateChart,
                deleteChart: deleteChartAction,
                addProject,
                updateProject,
                deleteProject: deleteProjectAction,
                addTheme,
                updateTheme,
                deleteTheme,
                updateConfig: updateConfigAction,
                addTimerSession: addTimerSessionAction,
                updateTimerSession: updateTimerSessionAction,
                deleteTimerSession: deleteTimerSessionAction,
                persistAll,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

// --- Hooks ---
export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used within StoreProvider');
    return ctx;
}

export function useAnalytics() {
    const { state } = useStore();
    const { charts, timerSessions, projects } = state;

    const chartsWithOutcome = charts.filter((c) => c.outcome);

    const overallStats: OverallStats = {
        totalCharts: charts.length,
        wins: chartsWithOutcome.filter((c) => c.outcome === 'win').length,
        losses: chartsWithOutcome.filter((c) => c.outcome === 'loss').length,
        breakevens: chartsWithOutcome.filter((c) => c.outcome === 'breakeven').length,
        winRate: chartsWithOutcome.length > 0
            ? (chartsWithOutcome.filter((c) => c.outcome === 'win').length / chartsWithOutcome.filter(c => c.outcome !== 'breakeven').length) * 100
            : 0,
        avgRR: (() => {
            const withRR = charts.filter((c) => c.riskReward && c.riskReward > 0);
            return withRR.length > 0
                ? withRR.reduce((sum, c) => sum + (c.riskReward || 0), 0) / withRR.length
                : 0;
        })(),
        totalTimeInvested: timerSessions.reduce((sum, s) => sum + s.duration, 0),
        totalPnl: charts.reduce((sum, c) => sum + (c.pnl || 0), 0),
        profitFactor: (() => {
            const grossProfit = charts.filter(c => (c.pnl || 0) > 0).reduce((sum, c) => sum + (c.pnl || 0), 0);
            const grossLoss = Math.abs(charts.filter(c => (c.pnl || 0) < 0).reduce((sum, c) => sum + (c.pnl || 0), 0));
            return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
        })()
    };

    const symbolStats: SymbolStats[] = (() => {
        const map = new Map<string, Chart[]>();
        charts.forEach((c) => {
            const arr = map.get(c.symbol) || [];
            arr.push(c);
            map.set(c.symbol, arr);
        });

        return Array.from(map.entries()).map(([symbol, symbolCharts]) => {
            const withOutcome = symbolCharts.filter((c) => c.outcome);
            const wins = withOutcome.filter((c) => c.outcome === 'win').length;
            const losses = withOutcome.filter((c) => c.outcome === 'loss').length;
            const breakevens = withOutcome.filter((c) => c.outcome === 'breakeven').length;
            const withRR = withOutcome.filter((c) => c.riskReward && c.riskReward > 0);
            const totalTime = timerSessions
                .filter((s) => s.symbol === symbol)
                .reduce((sum, s) => sum + s.duration, 0);
            const pnl = symbolCharts.reduce((sum, c) => sum + (c.pnl || 0), 0);

            return {
                symbol,
                trades: withOutcome.length,
                wins,
                losses,
                breakevens,
                winRate: (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0,
                avgRR: withRR.length > 0 ? withRR.reduce((s, c) => s + (c.riskReward || 0), 0) / withRR.length : 0,
                totalTime,
                pnl
            };
        });
    })();

    const timeframeStats: TimeframeStats[] = (() => {
        const map = new Map<string, Chart[]>();
        charts.forEach((c) => {
            const arr = map.get(c.timeframe) || [];
            arr.push(c);
            map.set(c.timeframe, arr);
        });

        return Array.from(map.entries()).map(([timeframe, tfCharts]) => {
            const withOutcome = tfCharts.filter((c) => c.outcome);
            const wins = withOutcome.filter((c) => c.outcome === 'win').length;
            const losses = withOutcome.filter((c) => c.outcome === 'loss').length;
            const pnl = tfCharts.reduce((sum, c) => sum + (c.pnl || 0), 0);
            return {
                timeframe,
                trades: withOutcome.length,
                wins,
                losses,
                winRate: (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0,
                pnl
            };
        });
    })();

    const rrBuckets: RRBucket[] = (() => {
        const buckets: Record<string, number> = {
            '0-0.5': 0, '0.5-1': 0, '1-1.5': 0, '1.5-2': 0, '2-2.5': 0, '2.5-3': 0, '3+': 0,
        };
        charts.filter((c) => c.riskReward).forEach((c) => {
            const rr = c.riskReward!;
            if (rr < 0.5) buckets['0-0.5']++;
            else if (rr < 1) buckets['0.5-1']++;
            else if (rr < 1.5) buckets['1-1.5']++;
            else if (rr < 2) buckets['1.5-2']++;
            else if (rr < 2.5) buckets['2-2.5']++;
            else if (rr < 3) buckets['2.5-3']++;
            else buckets['3+']++;
        });
        return Object.entries(buckets).map(([range, count]) => ({ range, count }));
    })();

    const projectTimeStats: ProjectTimeStats[] = (() => {
        const total = timerSessions.reduce((s, ts) => s + ts.duration, 0);
        const map = new Map<string, number>();
        timerSessions.forEach((s) => {
            map.set(s.projectId, (map.get(s.projectId) || 0) + s.duration);
        });

        return Array.from(map.entries()).map(([projectId, time]) => ({
            projectId,
            projectName: projects.find((p) => p.id === projectId)?.name || 'Unknown',
            totalTime: time,
            percentage: total > 0 ? (time / total) * 100 : 0,
        }));
    })();

    return { overallStats, symbolStats, timeframeStats, rrBuckets, projectTimeStats };
}
