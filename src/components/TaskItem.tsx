'use client';

import { Task } from '@/types/task';
import { useState } from 'react';
import CategorySelector from './CategorySelector';
import DatePicker from './DatePicker';
import PrioritySelector from './PrioritySelector';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number, completed: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
}

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

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggleComplete(task.id, !task.completed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateCategory = async (categoryId: number | null) => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, { category_id: categoryId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriority = async (priority: 'low' | 'medium' | 'high') => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, { priority });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDueDate = async (dueDate: string | null) => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, { due_date: dueDate });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (editTitle.trim() !== '' && editTitle !== task.title) {
      setIsLoading(true);
      try {
        await onUpdate(task.id, { title: editTitle });
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditing(false);
  };

  // Format due date for display
  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    
    if (dueDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  // Determine if task is overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;

  // Get priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`mb-3 border rounded-lg overflow-hidden transition-all duration-200 ${
      task.completed ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-300 dark:border-gray-600'
    }`}>
      <div className="flex items-center p-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          disabled={isLoading}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="ml-3 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded"
              autoFocus
            />
          ) : (
            <div 
              className="flex items-center gap-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className={`${task.completed ? 'line-through text-gray-500' : ''} ${isOverdue ? 'text-red-500' : ''}`}>
                {task.title}
              </span>
              
              {task.category_id && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full" 
                  style={{ 
                    backgroundColor: task.category_color + '33', // Add transparency
                    color: task.category_color 
                  }}
                >
                  {task.category_name}
                </span>
              )}
              
              {task.due_date && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {formatDueDate(task.due_date)}
                </span>
              )}
              
              <span className={`w-2 h-2 rounded-full ${getPriorityColor()}`}></span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Edit task"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-500 hover:text-red-700 p-1"
            aria-label="Delete task"
          >
            Delete
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <CategorySelector 
              selectedCategoryId={task.category_id} 
              onChange={handleUpdateCategory} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <PrioritySelector 
              value={task.priority || 'medium'} 
              onChange={handleUpdatePriority} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <DatePicker 
              value={task.due_date} 
              onChange={handleUpdateDueDate} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 