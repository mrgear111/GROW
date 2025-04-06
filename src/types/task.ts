export interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  due_time: string | null;
  created_at: string;
  updated_at: string;
  firebase_key?: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number | string, completed: boolean) => Promise<void>;
  onDelete: (id: number | string) => Promise<void>;
  onUpdate?: (id: number | string, updates: Partial<Task>) => Promise<void>;
} 