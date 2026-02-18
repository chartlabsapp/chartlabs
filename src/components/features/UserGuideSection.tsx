import { Book, CheckCircle2 } from 'lucide-react';
import { USER_GUIDE_DATA } from '../../data/knowledgeBase';
import './UserGuideSection.css';

export default function UserGuideSection() {
    return (
        <div className="user-guide-section">
            <div className="guide-header">
                <Book className="guide-header-icon" />
                <h2>Comprehensive Use Guide</h2>
                <p>Master every feature of ChartLabs with this step-by-step guide.</p>
            </div>

            <div className="guide-content">
                {USER_GUIDE_DATA.map((section, sidx) => (
                    <div key={section.title} className="guide-main-section">
                        <h3 className="section-title">{section.title}</h3>
                        {section.content.map((p, pidx) => (
                            <p key={pidx} className="section-paragraph">{p}</p>
                        ))}

                        {section.subsections && (
                            <div className="subsections-list">
                                {section.subsections.map((sub) => (
                                    <div key={sub.title} className="guide-subsection">
                                        <h4 className="subsection-title">{sub.title}</h4>
                                        <div className="subsection-content">
                                            {sub.content.map((line, lidx) => (
                                                <div key={lidx} className="content-line">
                                                    {line.startsWith('- ') ? (
                                                        <div className="bullet-line">
                                                            <span className="bullet">•</span>
                                                            <span>{line.substring(2)}</span>
                                                        </div>
                                                    ) : line.match(/^\d\./) ? (
                                                        <div className="number-line">
                                                            <span className="number">{line.split('.')[0]}.</span>
                                                            <span>{line.split('.').slice(1).join('.').trim()}</span>
                                                        </div>
                                                    ) : (
                                                        <p>{line}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {sidx < USER_GUIDE_DATA.length - 1 && <hr className="section-divider" />}
                    </div>
                ))}
            </div>

            <div className="guide-footer">
                <CheckCircle2 size={24} className="text-success" />
                <p>You're all set! Happy backtesting.</p>
            </div>
        </div>
    );
}
