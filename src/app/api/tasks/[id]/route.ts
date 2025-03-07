import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// PATCH to update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }
    
    const updates = await request.json();
    
    // Build the update query dynamically based on provided fields
    const allowedFields = ['completed', 'title', 'category_id', 'priority', 'due_date'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    // Validate the task exists before updating
    const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?').get(Number(id));
    if (!taskExists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Format the update query
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => {
      // Handle null values properly
      if (updates[field] === null) {
        return null;
      }
      // Convert boolean to integer for SQLite
      if (field === 'completed' && typeof updates[field] === 'boolean') {
        return updates[field] ? 1 : 0;
      }
      return updates[field];
    });
    
    // Add the ID to the values array
    values.push(Number(id));
    
    // Execute the update query
    try {
      const query = `UPDATE tasks SET ${setClause} WHERE id = ?`;
      const result = db.prepare(query).run(...values);
      
      if (result.changes === 0) {
        return NextResponse.json({ error: 'No changes made to task' }, { status: 400 });
      }
      
      // Fetch the updated task with category information
      const updatedTask = db.prepare(`
        SELECT t.*, c.name as category_name, c.color as category_color 
        FROM tasks t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).get(Number(id));
      
      return NextResponse.json(updatedTask);
    } catch (dbError) {
      console.error('Database error updating task:', dbError);
      return NextResponse.json({ 
        error: 'Database error updating task',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }
    
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