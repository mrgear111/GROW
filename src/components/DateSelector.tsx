'use client';

import { useState, useEffect } from 'react';

interface DateSelectorProps {
  onDateChange: (date: string | null) => void;
  selectedDate: string | null;
  label?: string;
  includeAllOption?: boolean;
}

export default function DateSelector({
  onDateChange,
  selectedDate,
  label = "Select Date",
  includeAllOption = true
}: DateSelectorProps) {
  // Initialize with the current date if no date is selected
  const [dateValue, setDateValue] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Predefined date options
  const dateOptions = [
    { name: "Today", value: new Date().toISOString().split('T')[0] },
    { 
      name: "Yesterday", 
      value: new Date(Date.now() - 86400000).toISOString().split('T')[0] 
    },
    { 
      name: "Last Week", 
      value: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] 
    },
  ];

  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
  const formatDateForDisplay = (dateStr: string | null): string => {
    if (!dateStr) return 'All Dates';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const handlePredefinedDateSelect = (dateStr: string) => {
    setDateValue(dateStr);
    onDateChange(dateStr);
    setShowDatePicker(false);
  };

  const handleCustomDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    onDateChange(newDate);
  };

  const handleAllDatesSelect = () => {
    setDateValue('');
    onDateChange(null);
    setShowDatePicker(false);
  };

  return (
    <div className="relative">
      <div className="flex flex-col space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center justify-between p-2 sm:p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {selectedDate ? formatDateForDisplay(selectedDate) : 'All Dates'}
            </span>
            <svg className={`h-4 w-4 text-gray-500 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDatePicker && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {includeAllOption && (
                <button
                  type="button"
                  onClick={handleAllDatesSelect}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedDate === null ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  All Dates
                </button>
              )}
              
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Quick Select
                </div>
                {dateOptions.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => handlePredefinedDateSelect(option.value)}
                    className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                      selectedDate === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Custom Date
                </div>
                <input
                  type="date"
                  value={dateValue}
                  onChange={handleCustomDateSelect}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 