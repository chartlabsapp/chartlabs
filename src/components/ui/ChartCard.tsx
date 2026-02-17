// ChartCard Component
import { useNavigate } from 'react-router-dom';
import type { Chart } from '../../types';
import './ChartCard.css';

interface ChartCardProps {
    chart: Chart;
    onDelete?: (id: string) => void;
}

export default function ChartCard({ chart, onDelete }: ChartCardProps) {
    const navigate = useNavigate();

    const outcomeBadge = chart.outcome ? (
        <span className={`badge badge-${chart.outcome === 'win' ? 'win' : chart.outcome === 'loss' ? 'loss' : 'breakeven'}`}>
            {chart.outcome.charAt(0).toUpperCase() + chart.outcome.slice(1)}
        </span>
    ) : null;

    return (
        <div className="chart-card" onClick={() => navigate(`/workspace/${chart.id}`)}>
            <div className="chart-card-image">
                {chart.thumbnailDataUrl ? (
                    <img src={chart.thumbnailDataUrl} alt={chart.setupName || chart.symbol} />
                ) : (
                    <div className="chart-card-placeholder">No Preview</div>
                )}
                <div className="chart-card-overlay">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); navigate(`/workspace/${chart.id}`); }}
                    >
                        Open
                    </button>
                    {onDelete && (
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => { e.stopPropagation(); onDelete(chart.id); }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
            <div className="chart-card-body">
                <div className="chart-card-top">
                    <span className="badge badge-accent">{chart.symbol}</span>
                    <span className="chart-card-tf">{chart.timeframe}</span>
                    {outcomeBadge}
                </div>
                {chart.setupName && <div className="chart-card-setup">{chart.setupName}</div>}
                <div className="chart-card-meta">
                    <span>{chart.tradingDay}</span>
                    {chart.direction && (
                        <span className={chart.direction === 'long' ? 'text-green' : 'text-red'}>
                            {chart.direction.toUpperCase()}
                        </span>
                    )}
                </div>
                {chart.tags.length > 0 && (
                    <div className="chart-card-tags">
                        {chart.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="chip">{tag}</span>
                        ))}
                        {chart.tags.length > 3 && <span className="chip">+{chart.tags.length - 3}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
