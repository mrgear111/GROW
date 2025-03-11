'use client';

import { useState, useEffect } from 'react';
import { Task, Category } from '@/types/task';
import TaskItem from '@/components/TaskItem';
import CategorySelector from '@/components/CategorySelector';
import DatePicker from '@/components/DatePicker';
import PrioritySelector from '@/components/PrioritySelector';
import { motion } from 'framer-motion';
import StreakCalendar from '@/components/StreakCalendar';
import { calculateStreak } from '@/lib/streakUtils';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<number | null>(null);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [view, setView] = useState<'all' | 'today' | 'upcoming'>('all');
  const [isAdvancedFormOpen, setIsAdvancedFormOpen] = useState(false);
  
  // New state for motivation features
  const [completedCount, setCompletedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Add this to your state variables
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionHistory: [] as { date: string; completed: boolean }[]
  });

  // Fetch tasks and categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, [filterCategory, showCompleted, view]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Caught error:', event.error);
      console.log('Error details:', {
        message: event.error.message,
        stack: event.error.stack
      });
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filterCategory !== null) {
        params.append('categoryId', filterCategory.toString());
      }
      
      if (!showCompleted) {
        params.append('completed', 'false');
      }
      
      const url = `/api/tasks?${params.toString()}`;
      
      const response = await fetch(url);
      
      // Check content type to handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response format');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      // Client-side filtering for views
      let filteredData = [...data];
      
      if (view === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredData = filteredData.filter((task: Task) => task.due_date === today);
      } else if (view === 'upcoming') {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        filteredData = filteredData.filter((task: Task) => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate >= today && dueDate <= nextWeek;
        });
      }
      
      setTasks(filteredData);
      
      // After fetching tasks, calculate streak
      const streakData = calculateStreak(filteredData);
      setStreakData(streakData);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: newTaskTitle,
          category_id: newTaskCategory,
          priority: newTaskPriority,
          due_date: newTaskDueDate
        }),
      });
      
      // Check content type to handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response format');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add task');
      }

      // Refresh the task list
      await fetchTasks();
      
      setNewTaskTitle('');
      
      if (isAdvancedFormOpen) {
        setNewTaskCategory(null);
        setNewTaskPriority('medium');
        setNewTaskDueDate(null);
      }
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: string | number, completed: boolean) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      
      // Update the task in the local state
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, ...updatedTask } : task
        )
      );
      
      // Show confetti if task was completed
      if (completed) {
        setCompletedCount(prev => prev + 1);
        setStreak(prev => prev + 1);
        
        // Show motivational message
        const quotes = [
          "Great job! Keep up the momentum!",
          "One step closer to your goals!",
          "Progress is progress, no matter how small!",
          "You're crushing it today!",
          "Success is built one task at a time!"
        ];
        setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        setShowMotivation(true);
        setTimeout(() => setShowMotivation(false), 3000);
      }
    } catch (err) {
      console.error('Error updating task completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task. Please try again.');
      // Re-fetch tasks to ensure UI is in sync with server
      await fetchTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string | number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleUpdateTask = async (id: string | number, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, ...updatedTask } : task
        )
      );
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && !task.completed
  ).length;
  const dueTodayTasks = tasks.filter(task => {
    if (!task.due_date || task.completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date === today;
  }).length;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Also update streak when tasks change
  useEffect(() => {
    const data = calculateStreak(tasks);
    setStreakData(data);
  }, [tasks]);

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Motivational banner */}
      {showMotivation && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg text-center"
        >
          <p className="text-lg sm:text-xl font-bold">{motivationalQuote}</p>
        </motion.div>
      )}

      {/* Hero Section with Progress Dashboard */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">Task Tracker</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white/20 p-4 sm:p-6 rounded-lg sm:rounded-xl backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-semibold">Progress</h3>
            <div className="mt-3 h-4 sm:h-5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium">{calculateProgress()}% complete</p>
          </div>
          
          <div className="bg-purple-700/50 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-2">Current Streak</h2>
            <div className="flex items-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {streakData.currentStreak} days
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-2 text-purple-100">
              {streakData.currentStreak > 0 
                ? "Keep it up! You're on a roll!" 
                : "Complete all of today's tasks to start a streak!"}
            </p>
          </div>
          
          <div className="bg-white/20 p-4 sm:p-6 rounded-lg sm:rounded-xl backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold">Today's Completed</h3>
            <div className="flex items-center mt-2">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">{completedCount}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* GitHub-like Streak Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Activity Calendar</h2>
          <StreakCalendar tasks={tasks} />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  View
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  {['all', 'today', 'upcoming'].map((viewOption) => (
                    <button
                      key={viewOption}
                      onClick={() => setView(viewOption as any)}
                      className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium ${
                        view === viewOption
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <CategorySelector 
                  selectedCategoryId={filterCategory} 
                  onChange={setFilterCategory}
                  includeAllOption={true}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-completed"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="show-completed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Show completed tasks
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Statistics</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Completion Rate</span>
                  <span className="font-medium text-xs sm:text-sm">{completionRate}%</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overdue</div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg sm:text-xl font-bold text-red-500">{overdueTasks}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Today</div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg sm:text-xl font-bold text-yellow-500">{dueTodayTasks}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Tasks</div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg sm:text-xl font-bold text-blue-500">{totalTasks}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longest Streak</div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg sm:text-xl font-bold text-purple-500">{streakData.longestStreak}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Add task form */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Add New Task</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                  <button
                    type="submit"
                    className="mt-2 sm:mt-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-l-none sm:rounded-r-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium text-sm sm:text-base"
                    disabled={isLoading || !newTaskTitle.trim()}
                  >
                    {isLoading ? (
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ) : (
                      'Add Task'
                    )}
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsAdvancedFormOpen(!isAdvancedFormOpen)}
                  className="mt-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  {isAdvancedFormOpen ? (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Hide options
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Show more options
                    </>
                  )}
                </button>
              </div>
              
              {isAdvancedFormOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <CategorySelector 
                      selectedCategoryId={newTaskCategory} 
                      onChange={setNewTaskCategory}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <PrioritySelector 
                      value={newTaskPriority} 
                      onChange={setNewTaskPriority} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <DatePicker 
                      value={newTaskDueDate} 
                      onChange={setNewTaskDueDate} 
                    />
                  </div>
                </motion.div>
              )}
            </form>
          </div>
          
          {/* Task list */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                {view === 'all' ? 'All Tasks' : view === 'today' ? "Today's Tasks" : 'Upcoming Tasks'}
              </h2>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            
            {isLoading && tasks.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">No tasks found</p>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Try changing your filters or add a new task</p>
              </div>
            ) : (
              <motion.div layout className="space-y-2 sm:space-y-3">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TaskItem
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
