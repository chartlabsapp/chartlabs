// EditableChipList Component
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './EditableChipList.css';

interface EditableChipListProps {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
}

export default function EditableChipList({ items, onChange, placeholder = 'Add item...' }: EditableChipListProps) {
    const [inputValue, setInputValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        const values = inputValue.split(',').map(v => v.trim()).filter(v => v && !items.includes(v));
        if (values.length > 0) {
            onChange([...items, ...values]);
            setInputValue('');
            setIsAdding(false);
        } else if (!inputValue.trim()) {
            setIsAdding(false);
        }
    };

    const handleRemove = (item: string) => {
        onChange(items.filter((i) => i !== item));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setInputValue('');
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Prevent closing if we are clicking one of the confirm/cancel buttons
        if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.chip-input-actions')) {
            return;
        }
        if (inputValue.trim()) {
            handleAdd();
        } else {
            setIsAdding(false);
        }
    };

    return (
        <div className="editable-chip-list">
            {items.map((item) => (
                <span key={item} className="chip">
                    {item}
                    <button className="chip-remove" onClick={() => handleRemove(item)} title="Remove">
                        <X size={10} />
                    </button>
                </span>
            ))}
            {isAdding ? (
                <div className="chip-input-wrap">
                    <input
                        autoFocus
                        className="chip-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                    />
                    <div className="chip-input-actions">
                        <button className="btn-chip-action btn-add" onClick={handleAdd} title="Confirm">
                            <Plus size={12} />
                        </button>
                        <button className="btn-chip-action btn-cancel" onClick={() => { setIsAdding(false); setInputValue(''); }} title="Cancel">
                            <X size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                <button className="chip chip-add" onClick={() => setIsAdding(true)}>
                    <Plus size={12} /> Add
                </button>
            )}
        </div>
    );
}
