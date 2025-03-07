import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// PATCH to update a task
export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const id = context.params.id;
    const updates = await request.json();
    
    // Validate updates
    const validFields = ['title', 'completed', 'category_id', 'priority', 'due_date'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);
    
    // Build the SQL query dynamically
    const setClause = Object.keys(filteredUpdates)
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    if (!setClause) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = @id
    `);
    
    const result = stmt.run({
      ...filteredUpdates,
      id: Number(id)
    });
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE to remove a task
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const id = context.params.id;
    
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 