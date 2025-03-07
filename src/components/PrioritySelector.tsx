'use client';

interface PrioritySelectorProps {
  value: string;
  onChange: (priority: 'low' | 'medium' | 'high') => void;
}

export default function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-blue-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' }
  ];

  return (
    <div className="flex gap-1 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      {priorities.map((priority) => (
        <button
          key={priority.value}
          type="button"
          onClick={() => onChange(priority.value as 'low' | 'medium' | 'high')}
          className={`px-3 py-2 text-sm ${
            value === priority.value 
              ? `${priority.color} text-white` 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {priority.label}
        </button>
      ))}
    </div>
  );
} 