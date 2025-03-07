'use client';

import { useState, useEffect } from 'react';
import { Task, Category } from '@/types/task';
import TaskItem from '@/components/TaskItem';
import CategorySelector from '@/components/CategorySelector';
import DatePicker from '@/components/DatePicker';
import PrioritySelector from '@/components/PrioritySelector';
import { motion } from 'framer-motion';

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

  // Fetch tasks and categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, [filterCategory, showCompleted, view]);

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

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      // Check content type to handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response format');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      // Update the task in the local state
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, ...data } : task
        )
      );
      
      // Celebrate completion!
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
    }
  };

  const handleDeleteTask = async (id: number) => {
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

  const handleUpdateTask = async (id: number, updates: Partial<Task>) => {
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Motivational banner */}
      {showMotivation && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-lg shadow-lg text-center"
        >
          <p className="text-xl font-bold">{motivationalQuote}</p>
        </motion.div>
      )}

      {/* Progress Dashboard */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Task Tracker</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Progress</h3>
            <div className="mt-2 h-4 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <p className="mt-1 text-sm">{calculateProgress()}% complete</p>
          </div>
          
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Today's Completed</h3>
            <p className="text-3xl font-bold">{completedCount}</p>
          </div>
          
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Current Streak</h3>
            <p className="text-3xl font-bold">{streak} days</p>
          </div>
        </div>
      </div>

      {/* Rest of your UI with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-r-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={isLoading || !newTaskTitle.trim()}
                  >
                    {isLoading ? (
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsAdvancedFormOpen(!isAdvancedFormOpen)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isAdvancedFormOpen ? 'Hide options' : 'Show more options'}
                </button>
              </div>
              
              {isAdvancedFormOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  View
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  {['all', 'today', 'upcoming'].map((viewOption) => (
                    <button
                      key={viewOption}
                      type="button"
                      onClick={() => setView(viewOption as any)}
                      className={`flex-1 px-3 py-2 text-sm ${
                        view === viewOption
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {viewOption === 'all' ? 'All' : 
                       viewOption === 'today' ? 'Today' : 'Upcoming'}
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
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCompleted"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="showCompleted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show completed tasks
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tasks List with animation */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">
          {view === 'all' ? 'All Tasks' : 
           view === 'today' ? 'Tasks Due Today' : 
           'Tasks Due in the Next 7 Days'}
          {filterCategory !== null && categories.find(c => c.id === filterCategory) && 
            ` - ${categories.find(c => c.id === filterCategory)?.name}`
          }
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-600 dark:text-gray-300">No tasks found</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try changing your filters or add a new task</p>
          </div>
        ) : (
          <motion.div layout className="space-y-2">
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
  );
}
