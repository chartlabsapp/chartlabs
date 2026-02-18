// ============================================
// BacktestPro — Core Type Definitions
// ============================================

export interface Chart {
  id: string;
  imageFileName: string;
  thumbnailDataUrl?: string;
  symbol: string;
  timeframe: string;
  session: string;
  setupName: string;
  direction?: 'long' | 'short';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
  outcome?: 'win' | 'loss' | 'breakeven';
  pnl?: number;
  tags: string[];
  notes: string;
  annotations?: string; // Fabric.js JSON
  secondaryImages?: string[]; // Filenames in the charts directory
  projectId: string;
  themeId?: string; // Optional: Project -> Theme hierarchy
  tradingDay: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface TimerSession {
  id: string;
  projectId: string;
  themeId?: string; // Optional: Link to a specific theme
  symbol: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  date: string; // YYYY-MM-DD
}

export interface StorageFolder {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  isConnected?: boolean;
}

export interface AppConfig {
  symbols: string[];
  timeframes: string[];
  sessions: string[];
  commonTags: string[];
  fileNameTemplate: string;
}

// Analytics computed types
export interface SymbolStats {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgRR: number;
  totalTime: number; // seconds
  pnl: number;
}

export interface TimeframeStats {
  timeframe: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
}

export interface RRBucket {
  range: string;
  count: number;
}

export interface ProjectTimeStats {
  projectId: string;
  projectName: string;
  totalTime: number; // seconds
  percentage: number;
}

export interface OverallStats {
  totalCharts: number;
  winRate: number;
  avgRR: number;
  totalTimeInvested: number; // seconds
  wins: number;
  losses: number;
  breakevens: number;
  totalPnl: number;
  profitFactor: number;
}

// App state
export interface AppState {
  charts: Chart[];
  projects: Project[];
  themes: Theme[];
  config: AppConfig;
  timerSessions: TimerSession[];
  storageFolders: StorageFolder[];
  activeFolderId: string | null;
  initialized: boolean;
}

// Default config
export const DEFAULT_CONFIG: AppConfig = {
  symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100', 'SPX500'],
  timeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'],
  sessions: ['London', 'New York', 'Asian', 'Sydney', 'London-NY Overlap'],
  commonTags: ['Supply Zone', 'Demand Zone', 'FVG', 'BOS', 'CHoCH', 'Liquidity Sweep', 'Order Block', 'Mitigation', 'Inducement', 'Imbalance'],
  fileNameTemplate: '{symbol}_{timeframe}_{session}_{date}_{outcome}',
};

export const DEFAULT_PROJECT: Project = {
  id: 'default',
  name: 'General',
  createdAt: new Date().toISOString(),
};
