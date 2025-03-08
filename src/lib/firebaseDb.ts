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
  const categoriesRef = ref(db, 'categories');
  const snapshot = await get(categoriesRef);
  
  if (!snapshot.exists()) {
    // No categories exist, add the defaults
    for (const category of defaultCategories) {
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, category);
    }
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
    tasks.push({
      id: childSnapshot.key as unknown as number,
      ...task,
      completed: !!task.completed // Ensure completed is boolean
    });
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

export const addTask = async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
  const tasksRef = ref(db, 'tasks');
  const newTaskRef = push(tasksRef);
  
  // Add created_at timestamp
  const newTask = {
    ...task,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
  
  return {
    id: newTaskRef.key as unknown as number,
    ...newTask,
    category_name: categoryName,
    category_color: categoryColor
  };
};

export const updateTask = async (id: number, updates: Partial<Task>): Promise<Task> => {
  const taskRef = ref(db, `tasks/${id}`);
  
  // Add updated_at timestamp
  const updatedTask = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await update(taskRef, updatedTask);
  
  // Get the updated task
  const snapshot = await get(taskRef);
  if (!snapshot.exists()) {
    throw new Error('Task not found');
  }
  
  const task = snapshot.val();
  
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
    id: snapshot.key as unknown as number,
    ...task,
    completed: !!task.completed, // Ensure completed is boolean
    category_name: categoryName,
    category_color: categoryColor
  };
};

export const deleteTask = async (id: number): Promise<void> => {
  const taskRef = ref(db, `tasks/${id}`);
  await remove(taskRef);
}; 