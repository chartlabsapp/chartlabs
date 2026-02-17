// StatsCard Component
import './StatsCard.css';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: { value: number; label: string };
    color?: 'default' | 'green' | 'red' | 'accent';
}

export default function StatsCard({ label, value, icon, trend, color = 'default' }: StatsCardProps) {
    return (
        <div className={`stats-card stats-card--${color}`}>
            <div className="stats-card-header">
                <span className="stats-card-label">{label}</span>
                {icon && <div className="stats-card-icon">{icon}</div>}
            </div>
            <div className="stats-card-value">{value}</div>
            {trend && (
                <div className={`stats-card-trend ${trend.value >= 0 ? 'positive' : 'negative'}`}>
                    {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
                </div>
            )}
        </div>
    );
}
