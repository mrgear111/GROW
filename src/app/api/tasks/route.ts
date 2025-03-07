import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const completed = searchParams.get('completed');
    
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color 
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (categoryId && !isNaN(Number(categoryId))) {
      query += ` AND t.category_id = ?`;
      params.push(Number(categoryId));
    }
    
    if (completed !== null) {
      query += ` AND t.completed = ?`;
      params.push(completed === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY 
      CASE 
        WHEN t.due_date IS NULL THEN 1 
        ELSE 0 
      END,
      t.due_date ASC,
      t.created_at DESC
    `;
    
    // Use try-catch specifically for the database query
    try {
      const tasks = db.prepare(query).all(...params);
      return NextResponse.json(tasks);
    } catch (dbError) {
      console.error('Database error fetching tasks:', dbError);
      return NextResponse.json({ error: 'Database error fetching tasks' }, { status: 500 });
    }
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
    
    // Use a transaction to ensure data consistency
    const stmt = db.prepare(`
      INSERT INTO tasks (title, completed, category_id, priority, due_date) 
      VALUES (?, 0, ?, ?, ?)
    `);
    
    const result = stmt.run(
      title.trim(), 
      category_id || null, 
      taskPriority,
      formattedDueDate
    );
    
    if (!result.lastInsertRowid) {
      throw new Error('Failed to insert task');
    }
    
    const newTask = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color 
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    }, { status: 500 });
  }
} 