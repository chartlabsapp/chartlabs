import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQ_DATA } from '../../data/knowledgeBase';
import './FAQSection.css';

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Group by category
    const categories = Array.from(new Set(FAQ_DATA.map(item => item.category)));

    return (
        <div className="faq-section">
            <div className="faq-header">
                <HelpCircle className="faq-header-icon" />
                <h2>Frequently Asked Questions</h2>
                <p>Everything you need to know about ChartLabs.</p>
            </div>

            <div className="faq-container">
                {categories.map(category => (
                    <div key={category} className="faq-category-group">
                        <h3 className="faq-category-title">{category}</h3>
                        <div className="faq-list">
                            {FAQ_DATA.filter(item => item.category === category).map((item) => {
                                const globalIdx = FAQ_DATA.indexOf(item);
                                const isOpen = openIndex === globalIdx;
                                return (
                                    <div
                                        key={item.question}
                                        className={`faq-item ${isOpen ? 'open' : ''}`}
                                    >
                                        <button
                                            className="faq-question"
                                            onClick={() => toggle(globalIdx)}
                                            aria-expanded={isOpen}
                                        >
                                            <span>{item.question}</span>
                                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        <div className="faq-answer">
                                            <div className="faq-answer-content">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
