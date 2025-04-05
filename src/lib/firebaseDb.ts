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
  
  // If there's a category_id, fetch the category details
  if (task.category_id) {
    // Get all categories and find the matching one
    const categoriesRef = ref(db, 'categories');
    const categoriesSnapshot = await get(categoriesRef);
    
    if (categoriesSnapshot.exists()) {
      categoriesSnapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const category = childSnapshot.val();
        
        // Check if this is the category we're looking for - fix null check
        if (key && task.category_id && key === task.category_id.toString()) {
          // Add category info to the new task
          newTask.category_name = category.name;
          newTask.category_color = category.color;
          console.log(`Found category: ${category.name} with color ${category.color}`);
          return true; // Break the forEach loop
        }
      });
    }
  }
  
  // Set default category info if not found or not provided
  if (!newTask.category_name) {
    newTask.category_name = 'No Category';
    newTask.category_color = '#9ca3af';
  }
  
  console.log('Saving task with data:', newTask);
  
  // Now save the task with category info included
  await set(newTaskRef, newTask);
  
  // Fix the type error with firebase_key
  const firebaseKey = newTaskRef.key || undefined;
  
  // Return the complete task object
  return {
    id: newTaskRef.key as string,
    firebase_key: firebaseKey,
    ...newTask
  };
};

export const updateTask = async (id: number | string, updates: Partial<Task>): Promise<Task> => {
  console.log(`Updating task with ID: ${id}`, updates);
  
  // First, find the task by ID to get its Firebase key
  const tasksRef = ref(db, 'tasks');
  const snapshot = await get(tasksRef);
  
  let taskKey = null;
  let existingTask: Record<string, any> | null = null;
  
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const task = childSnapshot.val();
      
      // Check if this is the task we want to update
      // It could match by id or the key itself could be the id
      if ((task && task.id && task.id.toString() === id.toString()) || 
          (key === id)) {
        taskKey = key;
        existingTask = task;
        console.log(`Found task with key: ${taskKey}`, existingTask);
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
  
  // Create the merged task with existing data and updates
  const updatedTask = {
    ...(existingTask || {}),
    ...processedUpdates,
    updated_at: new Date().toISOString()
  };
  
  // If category_id is being updated, fetch the category details
  if (processedUpdates.category_id !== undefined) {
    // Get all categories and find the matching one
    const categoriesRef = ref(db, 'categories');
    const categoriesSnapshot = await get(categoriesRef);
    
    console.log(`Looking for category with ID: ${processedUpdates.category_id}`);
    
    if (categoriesSnapshot.exists() && processedUpdates.category_id !== null) {
      let categoryFound = false;
      
      categoriesSnapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const category = childSnapshot.val();
        
        console.log(`Checking category: ${key}`, category);
        
        // Check if this is the category we're looking for - fix null check
        if (key && processedUpdates.category_id && key === processedUpdates.category_id.toString()) {
          console.log(`Found category: ${category.name} with color ${category.color}`);
          
          // Add category info to the updates
          updatedTask.category_name = category.name;
          updatedTask.category_color = category.color;
          categoryFound = true;
          
          return true; // Break the forEach loop
        }
      });
      
      if (!categoryFound) {
        console.warn(`Category with ID ${processedUpdates.category_id} not found`);
        // Default to "No Category" if the category is not found
        updatedTask.category_name = 'No Category';
        updatedTask.category_color = '#9ca3af';
      }
    } else if (processedUpdates.category_id === null) {
      // If category is being removed, clear the category info
      updatedTask.category_name = 'No Category';
      updatedTask.category_color = '#9ca3af';
    }
  }
  
  console.log('Final task updates to save:', updatedTask);
  
  // Update the task using the Firebase key
  const taskRef = ref(db, `tasks/${taskKey}`);
  await update(taskRef, updatedTask);
  
  // Get the updated task
  const updatedSnapshot = await get(taskRef);
  if (!updatedSnapshot.exists()) {
    throw new Error('Task not found after update');
  }
  
  const task = updatedSnapshot.val();
  console.log('Task after update:', task);
  
  return {
    id: id,
    firebase_key: taskKey,
    ...task,
    completed: task.completed === true,
    category_name: task.category_name || 'No Category',
    category_color: task.category_color || '#9ca3af'
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

// New function to fix all tasks in the database
export const fixAllTaskCategories = async (): Promise<void> => {
  console.log('Starting to fix all task categories...');
  
  // Get all tasks
  const tasksRef = ref(db, 'tasks');
  const tasksSnapshot = await get(tasksRef);
  
  if (!tasksSnapshot.exists()) {
    console.log('No tasks found in the database.');
    return;
  }
  
  // Get all categories
  const categoriesRef = ref(db, 'categories');
  const categoriesSnapshot = await get(categoriesRef);
  
  const categories: Record<string, { name: string, color: string }> = {};
  
  if (categoriesSnapshot.exists()) {
    categoriesSnapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const category = childSnapshot.val();
      if (key) {
        categories[key] = {
          name: category.name,
          color: category.color
        };
      }
    });
  }
  
  console.log('Found categories:', categories);
  
  // Fix each task
  const updatePromises: Promise<void>[] = [];
  
  tasksSnapshot.forEach((childSnapshot) => {
    const key = childSnapshot.key;
    const task = childSnapshot.val();
    
    if (!key || !task) return;
    
    let needsUpdate = false;
    const updates: Record<string, any> = {};
    
    // Check if this task has a category_id but missing category info
    if (task.category_id) {
      const categoryKey = task.category_id.toString();
      const category = categories[categoryKey];
      
      if (category) {
        // Category exists, make sure name and color are set
        if (task.category_name !== category.name) {
          updates.category_name = category.name;
          needsUpdate = true;
        }
        
        if (task.category_color !== category.color) {
          updates.category_color = category.color;
          needsUpdate = true;
        }
      } else {
        // Category doesn't exist, set to No Category
        updates.category_name = 'No Category';
        updates.category_color = '#9ca3af';
        needsUpdate = true;
      }
    } else if (!task.category_name || !task.category_color) {
      // No category_id and missing category info
      updates.category_name = 'No Category';
      updates.category_color = '#9ca3af';
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log(`Fixing task ${key}:`, updates);
      const taskRef = ref(db, `tasks/${key}`);
      updatePromises.push(update(taskRef, updates));
    }
  });
  
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
    console.log(`Fixed ${updatePromises.length} tasks.`);
  } else {
    console.log('All tasks already have correct category information.');
  }
};