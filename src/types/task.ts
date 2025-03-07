export interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  category_id: number | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
}

export interface Category {
  id: number;
  name: string;
  color: string;
} 