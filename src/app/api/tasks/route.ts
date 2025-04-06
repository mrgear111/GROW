import { NextRequest, NextResponse } from 'next/server';
import { getTasks, addTask } from '@/lib/firebaseDb';

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const completed = searchParams.get('completed');
    const date = searchParams.get('date');
    const dateField = searchParams.get('dateField');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const filters: { 
      categoryId?: string; 
      completed?: boolean;
      date?: string;
      dateField?: 'due_date' | 'created_at';
      startDate?: string;
      endDate?: string;
    } = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (completed !== null) {
      filters.completed = completed === 'true';
    }
    
    // Add date-based filters
    if (date) {
      filters.date = date;
    }
    
    if (dateField && (dateField === 'due_date' || dateField === 'created_at')) {
      filters.dateField = dateField;
    }
    
    if (startDate) {
      filters.startDate = startDate;
    }
    
    if (endDate) {
      filters.endDate = endDate;
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
    const { title, category_id, priority, due_date, due_time } = await request.json();
    
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

    // Validate due_time format if provided (HH:mm)
    let formattedDueTime = null;
    if (due_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(due_time)) {
        formattedDueTime = due_time;
      }
    }
    
    const newTask = await addTask({
      title: title.trim(),
      completed: false,
      category_id: category_id || null,
      priority: taskPriority as 'low' | 'medium' | 'high',
      due_date: formattedDueDate,
      due_time: formattedDueTime,
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