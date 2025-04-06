'use client';

import { useState } from 'react';

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <div className="relative">
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full p-2 sm:p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
} 