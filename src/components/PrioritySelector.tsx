'use client';

interface PrioritySelectorProps {
  value: string;
  onChange: (priority: 'low' | 'medium' | 'high') => void;
}

export default function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const priorities = [
    { 
      value: 'low', 
      label: 'Low', 
      color: 'bg-blue-500',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      color: 'bg-yellow-500',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      value: 'high', 
      label: 'High', 
      color: 'bg-red-500',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex gap-1 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      {priorities.map((priority) => (
        <button
          key={priority.value}
          type="button"
          onClick={() => onChange(priority.value as 'low' | 'medium' | 'high')}
          className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex items-center justify-center ${
            value === priority.value 
              ? `${priority.color} text-white` 
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          {priority.icon}
          {priority.label}
        </button>
      ))}
    </div>
  );
} 