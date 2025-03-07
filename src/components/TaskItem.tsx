'use client';

import { Task } from '@/types/task';
import { useState } from 'react';
import CategorySelector from './CategorySelector';
import DatePicker from './DatePicker';
import PrioritySelector from './PrioritySelector';
import { motion } from 'framer-motion';

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
    if (editTitle.trim() === '') return;
    
    setIsLoading(true);
    try {
      await onUpdate(task.id, { title: editTitle });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
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
      className={`border ${task.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'} dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 ${
        isExpanded ? 'shadow-md' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                task.completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-400 dark:border-gray-500'
              }`}
            >
              {isLoading ? (
                <span className="h-3 w-3 block rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : task.completed ? (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
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
                  className="flex-1 p-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                  disabled={isLoading}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(task.title);
                  }}
                  className="ml-1 p-1 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div 
                className={`text-lg ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {task.title}
              </div>
            )}
            
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {task.category_id && (
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: task.category_color ? `${task.category_color}20` : '#e5e7eb',
                    color: task.category_color || '#374151'
                  }}
                >
                  <span 
                    className="mr-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.category_color || '#374151' }}
                  ></span>
                  {task.category_name}
                </span>
              )}
              
              <span className={`${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              
              {task.due_date && (
                <span className={`flex items-center ${getDueDateColor(task.due_date)}`}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setIsEditing(true);
                setIsExpanded(true);
              }}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Edit"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="Delete"
              disabled={isLoading}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700"
        >
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
        </motion.div>
      )}
    </motion.div>
  );
} 