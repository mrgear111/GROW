import { safeFirstChar, safeString } from '@/lib/utils';
import { TaskItemProps } from '@/types/task';

export default function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  // Ensure task object exists and has expected properties
  if (!task) {
    console.error('TaskItem received undefined task');
    return null; // Don't render anything if task is undefined
  }
  
  // Safely handle potentially undefined category_color
  const categoryColor = task.category_color || '#9ca3af'; // Default gray color
  
  // Safely handle potentially undefined category_name
  const categoryName = safeString(task.category_name, 'No Category');
  
  // Get the first character safely
  const categoryInitial = safeFirstChar(categoryName, '?');
  
  const handleToggle = async () => {
    try {
      await onToggleComplete(task.id, !task.completed);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };
  
  return (
    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium mr-3" 
        style={{ backgroundColor: categoryColor }}
      >
        {categoryInitial}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {categoryName} • {task.priority}
          {task.due_date && ` • Due: ${task.due_date}`}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleToggle}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {task.completed ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
} 