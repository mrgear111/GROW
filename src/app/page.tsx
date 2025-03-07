'use client';

import { useState, useEffect } from 'react';
import { Task, Category } from '@/types/task';
import TaskItem from '@/components/TaskItem';
import CategorySelector from '@/components/CategorySelector';
import DatePicker from '@/components/DatePicker';
import PrioritySelector from '@/components/PrioritySelector';

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Task Tracker</h1>
      
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h3>
          <p className="text-2xl font-bold">{totalTasks}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
          <p className="text-2xl font-bold">{completionRate}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</h3>
          <p className="text-2xl font-bold text-red-500">{overdueTasks}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</h3>
          <p className="text-2xl font-bold text-blue-500">{dueTodayTasks}</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setIsAdvancedFormOpen(!isAdvancedFormOpen)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isAdvancedFormOpen ? 'Hide options' : 'Show more options'}
          </button>
          
          {isAdvancedFormOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
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
            </div>
          )}
        </div>
      </form>
      
      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              View
            </label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              {[
                { value: 'all', label: 'All' },
                { value: 'today', label: 'Today' },
                { value: 'upcoming', label: 'Next 7 Days' }
              ].map((viewOption) => (
                <button
                  key={viewOption.value}
                  type="button"
                  onClick={() => setView(viewOption.value as 'all' | 'today' | 'upcoming')}
                  className={`flex-1 px-3 py-2 text-sm ${
                    view === viewOption.value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {viewOption.label}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowCompleted(true)}
                className={`flex-1 px-3 py-2 text-sm ${
                  showCompleted 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setShowCompleted(false)}
                className={`flex-1 px-3 py-2 text-sm ${
                  !showCompleted 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Active Only
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">
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
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No tasks found</p>
            <p className="text-sm">Try changing your filters or add a new task</p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
