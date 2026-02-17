// ============================================
// BacktestPro — Sidebar Navigation
// ============================================

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Timer,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    Folder,
    Hash,
    LogIn
} from 'lucide-react';
import { useStore } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import type { Project, Theme } from '../../types';
import './Sidebar.css';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/timer', icon: Timer, label: 'Timer' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const { state } = useStore();
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(false);

    const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

    return (
        <aside
            className={`sidebar ${expanded ? 'expanded' : ''}`}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div className="sidebar-logo">
                <div className="logo-mark">BP</div>
                {expanded && <span className="logo-text">BacktestPro</span>}
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon size={18} />
                        {expanded && <span className="sidebar-label">{label}</span>}
                    </NavLink>
                ))}

                <div className="sidebar-divider" />

                {expanded && (
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">PROJECTS</div>
                        <div className="sidebar-projects-list">
                            {state.projects.map(project => (
                                <ProjectItem key={project.id} project={project} themes={state.themes.filter(t => t.projectId === project.id)} />
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                {user ? (
                    <NavLink to="/settings" className="sidebar-user-badge" title={user.email || 'Account'}>
                        <div className="sidebar-avatar">{userInitial}</div>
                        {expanded && <span className="sidebar-label sidebar-user-email">{user.email}</span>}
                    </NavLink>
                ) : (
                    <NavLink to="/settings" className="sidebar-user-badge" title="Sign in">
                        <LogIn size={18} />
                        {expanded && <span className="sidebar-label">Sign in</span>}
                    </NavLink>
                )}
                <div className="sidebar-version">
                    {expanded ? 'v1.0 MVP' : 'v1'}
                </div>
            </div>
        </aside>
    );
}

function ProjectItem({ project, themes }: { project: Project, themes: Theme[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="sidebar-project-item">
            <div className="sidebar-project-header" onClick={() => setOpen(!open)}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={14} />
                <span className="sidebar-label">{project.name}</span>
            </div>
            {open && (
                <div className="sidebar-theme-list">
                    {themes.map(theme => (
                        <NavLink
                            key={theme.id}
                            to={`/?project=${project.id}&theme=${theme.id}`}
                            className={({ isActive }) => `sidebar-theme-link ${isActive ? 'active' : ''}`}
                        >
                            <Hash size={12} />
                            <span className="sidebar-label">{theme.name}</span>
                        </NavLink>
                    ))}
                    {themes.length === 0 && <div className="sidebar-no-data">No themes</div>}
                </div>
            )}
        </div>
    );
}
