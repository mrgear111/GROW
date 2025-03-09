import { NextRequest, NextResponse } from 'next/server';
import { getTasks, addTask } from '@/lib/firebaseDb';

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const completed = searchParams.get('completed');
    
    const filters: { categoryId?: string; completed?: boolean } = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (completed !== null) {
      filters.completed = completed === 'true';
    }
    
    const tasks = await getTasks(filters);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
    }, { status: 500 });
  }
}

// POST a new task
export async function POST(request: NextRequest) {
  try {
    const { title, category_id, priority, due_date } = await request.json();
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';
    
    // Validate due_date format if provided
    let formattedDueDate = null;
    if (due_date) {
      try {
        // Ensure it's a valid date string
        const date = new Date(due_date);
        if (!isNaN(date.getTime())) {
          formattedDueDate = due_date;
        }
      } catch (e) {
        console.error('Invalid date format:', e);
      }
    }
    
    const newTask = await addTask({
      title: title.trim(),
      completed: false,
      category_id: category_id || null,
      priority: taskPriority as 'low' | 'medium' | 'high',
      due_date: formattedDueDate,
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    }, { status: 500 });
  }
} 