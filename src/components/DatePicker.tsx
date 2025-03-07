'use client';

import { useState } from 'react';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
      >
        <span>{value ? formatDisplayDate(value) : 'Set due date'}</span>
        {value && (
          <button 
            onClick={handleClear}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <input
            type="date"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value || null);
              setIsOpen(false);
            }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded"
          />
        </div>
      )}
    </div>
  );
} 