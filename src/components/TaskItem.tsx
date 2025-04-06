'use client';

import { Task } from '@/types/task';
import { useState } from 'react';
import CategorySelector from './CategorySelector';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import PrioritySelector from './PrioritySelector';
import { motion } from 'framer-motion';
import { safeFirstChar, safeString } from '@/lib/utils';
import { TaskItemProps } from '@/types/task';

export default function TaskItem({ 
  task, 
  onToggleComplete, 
  onDelete,
  onUpdate 
}: TaskItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  // Debug logging
  console.log('TaskItem rendering with task:', {
    id: task.id,
    title: task.title,
    category_id: task.category_id,
    category_name: task.category_name,
    category_color: task.category_color
  });

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
    setIsLoading(true);
    try {
      await onToggleComplete(task.id, !task.completed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateTitle = async () => {
    if (editTitle.trim() === '' || !onUpdate) return;
    
    setIsLoading(true);
    try {
      await onUpdate(task.id, { title: editTitle });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId: number | null) => {
    if (!onUpdate) return;
    
    console.log('Updating category to:', categoryId);
    setIsLoading(true);
    try {
      const updatedTask = await onUpdate(task.id, { category_id: categoryId });
      console.log('Task after update:', updatedTask);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriority = async (priority: 'low' | 'medium' | 'high') => {
    if (!onUpdate) return;
    
    setIsLoading(true);
    try {
      await onUpdate(task.id, { priority });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDueDate = async (dueDate: string | null) => {
    if (!onUpdate) return;
    
    setIsLoading(true);
    try {
      await onUpdate(task.id, { due_date: dueDate });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDueTime = async (dueTime: string | null) => {
    if (!onUpdate) return;
    
    setIsLoading(true);
    try {
      await onUpdate(task.id, { due_time: dueTime });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (dueDate < today) {
      return `Overdue: ${dueDate.toLocaleDateString()}`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const formatDueTime = (timeString: string | null) => {
    if (!timeString) return null;
    
    // Format time in 12-hour format with AM/PM
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getDueDateColor = (dateString: string | null) => {
    if (!dateString) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return 'text-red-600 font-medium';
    }
    return '';
  };

  return (
    <motion.div 
      layout
      className={`border ${
        task.completed 
          ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/30' 
          : 'border-gray-200 dark:border-gray-700'
      } rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md ${
        isExpanded ? 'shadow-md' : ''
      }`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-4">
          <div className="pt-1">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-400 dark:border-gray-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              {isLoading ? (
                <span className="h-2 w-2 sm:h-3 sm:w-3 block rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : task.completed ? (
                <svg className="h-2 w-2 sm:h-3 sm:w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : null}
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 p-1.5 sm:p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTitle();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditTitle(task.title);
                    }
                  }}
                />
                <button
                  onClick={handleUpdateTitle}
                  className="ml-1 sm:ml-2 p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(task.title);
                  }}
                  className="ml-1 p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                className={`text-sm sm:text-base font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'} cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {task.title}
              </div>
            )}
            
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: categoryColor ? `${categoryColor}20` : '#e5e7eb',
                  color: categoryColor || '#374151'
                }}
              >
                <span 
                  className="mr-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full"
                  style={{ backgroundColor: categoryColor || '#374151' }}
                ></span>
                {categoryName}
              </span>
              
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClasses(task.priority)}`}>
                {task.priority === 'high' && (
                  <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {task.priority === 'medium' && (
                  <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {task.priority === 'low' && (
                  <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDueDateBadgeClasses(task.due_date)}`}>
                <svg className="h-2.5 w-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {task.due_date ? formatDueDate(task.due_date) : 'No due date'}
                {task.due_time && (
                  <span className="ml-1">
                    • {formatDueTime(task.due_time)}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <button
              onClick={() => {
                setIsEditing(true);
                setIsExpanded(true);
              }}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Delete"
              disabled={isLoading}
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
        >
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <CategorySelector 
              selectedCategoryId={task.category_id} 
              onChange={handleUpdateCategory} 
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <PrioritySelector 
              value={task.priority || 'medium'} 
              onChange={handleUpdatePriority} 
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <DatePicker 
              value={task.due_date} 
              onChange={handleUpdateDueDate} 
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Time
            </label>
            <TimePicker 
              value={task.due_time} 
              onChange={handleUpdateDueTime} 
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function getPriorityBadgeClasses(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getDueDateBadgeClasses(dateString: string | null) {
  if (!dateString) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
  
  if (dueDate.getTime() === today.getTime()) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  }
  
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
} 