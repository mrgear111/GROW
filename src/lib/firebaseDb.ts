import { ref, get, set, push, update, remove, query, orderByChild } from "firebase/database";
import { db } from "./firebase";
import { Task, Category } from "@/types/task";

// Default categories to initialize the database
const defaultCategories = [
  { name: 'Work', color: '#4f46e5' },
  { name: 'Personal', color: '#16a34a' },
  { name: 'Shopping', color: '#ea580c' },
  { name: 'Health', color: '#dc2626' },
  { name: 'Education', color: '#9333ea' }
];

// Initialize the database with default categories if they don't exist
export const initializeDatabase = async () => {
  // First, clean up any invalid entries
  await cleanupDatabase();
  
  const categoriesRef = ref(db, 'categories');
  const snapshot = await get(categoriesRef);
  
  if (!snapshot.exists()) {
    // No categories exist, add the defaults
    for (const category of defaultCategories) {
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, category);
    }
    console.log('Default categories added');
  }
};

// Categories API
export const getCategories = async (): Promise<Category[]> => {
  const categoriesRef = ref(db, 'categories');
  const snapshot = await get(categoriesRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const categories: Category[] = [];
  snapshot.forEach((childSnapshot) => {
    categories.push({
      id: childSnapshot.key as unknown as number,
      ...childSnapshot.val()
    });
  });
  
  return categories.sort((a, b) => a.name.localeCompare(b.name));
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesRef = ref(db, 'categories');
  const newCategoryRef = push(categoriesRef);
  await set(newCategoryRef, category);
  
  return {
    id: newCategoryRef.key as unknown as number,
    ...category
  };
};

// Tasks API
export const getTasks = async (filters: { categoryId?: string; completed?: boolean } = {}): Promise<Task[]> => {
  const tasksRef = ref(db, 'tasks');
  const snapshot = await get(tasksRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  let tasks: Task[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const task = childSnapshot.val();
    const key = childSnapshot.key;
    
    // Skip entries that are not valid tasks
    if (!task || typeof task !== 'object' || !('title' in task)) {
      console.warn(`Skipping invalid task with key: ${key}`);
      return; // Skip this iteration
    }
    
    // Store the Firebase key as the task ID
    const processedTask = {
      id: task.id || key, // Use existing ID or Firebase key
      firebase_key: key, // Store the Firebase key explicitly
      title: task.title || 'Untitled Task',
      completed: !!task.completed,
      category_id: task.category_id || null,
      category_name: task.category_name || 'No Category',
      category_color: task.category_color || '#9ca3af',
      priority: task.priority || 'medium',
      due_date: task.due_date || null,
      created_at: task.created_at || new Date().toISOString(),
      updated_at: task.updated_at || new Date().toISOString()
    };
    
    tasks.push(processedTask);
  });
  
  // Apply filters
  if (filters.categoryId) {
    // Convert string categoryId to number for comparison
    const categoryIdNum = Number(filters.categoryId);
    tasks = tasks.filter(task => task.category_id === categoryIdNum);
  }
  
  if (filters.completed !== undefined) {
    tasks = tasks.filter(task => task.completed === filters.completed);
  }
  
  // Sort tasks: first by due date (null last), then by creation date (newest first)
  tasks.sort((a, b) => {
    // First sort by due date (null values last)
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    // Then sort by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return tasks;
};

export const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string }): Promise<Task> => {
  const tasksRef = ref(db, 'tasks');
  const newTaskRef = push(tasksRef);
  
  // Add created_at timestamp and ensure completed is a boolean
  const newTask = {
    ...task,
    completed: task.completed === true, // Ensure it's a boolean
    created_at: new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString() // Use provided value or generate new one
  };
  
  await set(newTaskRef, newTask);
  
  // If there's a category_id, fetch the category details
  let categoryName = null;
  let categoryColor = null;
  
  if (task.category_id) {
    const categoryRef = ref(db, `categories/${task.category_id}`);
    const categorySnapshot = await get(categoryRef);
    if (categorySnapshot.exists()) {
      const category = categorySnapshot.val();
      categoryName = category.name;
      categoryColor = category.color;
    }
  }
  
  // Ensure ID is a valid number
  let taskId: number;
  if (newTaskRef.key) {
    const numericId = Number(newTaskRef.key);
    taskId = !isNaN(numericId) ? numericId : Date.now();
  } else {
    taskId = Date.now();
  }
  
  return {
    id: taskId,
    ...newTask,
    category_name: categoryName,
    category_color: categoryColor
  };
};

export const updateTask = async (id: number | string, updates: Partial<Task>): Promise<Task> => {
  console.log(`Updating task with ID: ${id}`);
  
  // First, find the task by ID to get its Firebase key
  const tasksRef = ref(db, 'tasks');
  const snapshot = await get(tasksRef);
  
  let taskKey = null;
  
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const task = childSnapshot.val();
      
      // Check if this is the task we want to update
      // It could match by id or the key itself could be the id
      if ((task && task.id && task.id.toString() === id.toString()) || 
          (key === id)) {
        taskKey = key;
        console.log(`Found task with key: ${taskKey}`);
        return true; // Break the forEach loop
      }
    });
  }
  
  if (!taskKey) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  // Process updates to ensure completed is a boolean if present
  const processedUpdates = { ...updates };
  if ('completed' in processedUpdates) {
    processedUpdates.completed = processedUpdates.completed === true;
  }
  
  // Add updated_at timestamp
  const updatedTask = {
    ...processedUpdates,
    updated_at: new Date().toISOString()
  };
  
  // Update the task using the Firebase key
  const taskRef = ref(db, `tasks/${taskKey}`);
  await update(taskRef, updatedTask);
  
  // Get the updated task
  const updatedSnapshot = await get(taskRef);
  if (!updatedSnapshot.exists()) {
    throw new Error('Task not found after update');
  }
  
  const task = updatedSnapshot.val();
  
  // If there's a category_id, fetch the category details
  let categoryName = null;
  let categoryColor = null;
  
  if (task.category_id) {
    const categoryRef = ref(db, `categories/${task.category_id}`);
    const categorySnapshot = await get(categoryRef);
    if (categorySnapshot.exists()) {
      const category = categorySnapshot.val();
      categoryName = category.name;
      categoryColor = category.color;
    }
  }
  
  return {
    id: id,
    firebase_key: taskKey,
    ...task,
    completed: task.completed === true,
    category_name: categoryName || 'No Category',
    category_color: categoryColor || '#9ca3af'
  };
};

export const deleteTask = async (id: number | string): Promise<void> => {
  console.log(`Attempting to delete task with ID: ${id}`);
  
  // We need to find the Firebase key for this task ID
  const tasksRef = ref(db, 'tasks');
  const snapshot = await get(tasksRef);
  
  if (snapshot.exists()) {
    let foundKey = null;
    
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const task = childSnapshot.val();
      
      // Check if this is the task we want to delete
      // It could match by id or the key itself could be the id
      if ((task && task.id && task.id.toString() === id.toString()) || 
          (key === id)) {
        foundKey = key;
        console.log(`Found task with key: ${foundKey}`);
        return true; // Break the forEach loop
      }
    });
    
    if (foundKey) {
      // Delete the task using the Firebase key
      const taskRef = ref(db, `tasks/${foundKey}`);
      await remove(taskRef);
      console.log(`Task with key ${foundKey} deleted successfully`);
    } else {
      console.log(`Could not find task with ID: ${id}`);
    }
  } else {
    console.log('No tasks found in database');
  }
};

// Function to clean up invalid entries in the database
export const cleanupDatabase = async (): Promise<void> => {
  console.log('Starting database cleanup...');
  
  // Clean up tasks
  const tasksRef = ref(db, 'tasks');
  const tasksSnapshot = await get(tasksRef);
  
  if (tasksSnapshot.exists()) {
    const cleanupPromises: Promise<void>[] = [];
    
    tasksSnapshot.forEach((childSnapshot) => {
      const task = childSnapshot.val();
      const key = childSnapshot.key;
      
      // Check if this is an invalid entry
      if (!task || typeof task !== 'object' || !('title' in task)) {
        console.log(`Removing invalid task with key: ${key}`);
        const invalidTaskRef = ref(db, `tasks/${key}`);
        cleanupPromises.push(remove(invalidTaskRef));
      }
    });
    
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log(`Removed ${cleanupPromises.length} invalid entries`);
    } else {
      console.log('No invalid entries found');
    }
  }
  
  console.log('Database cleanup completed');
}; 