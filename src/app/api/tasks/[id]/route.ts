import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// PATCH to update a task
export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const id = context.params.id;
    console.log('Updating task with ID:', id);
    
    const updates = await request.json();
    console.log('Updates received:', updates);
    
    // Validate updates
    const validFields = ['title', 'completed', 'category_id', 'priority', 'due_date'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        // Convert boolean 'completed' to integer for SQLite
        if (key === 'completed') {
          obj[key] = updates[key] ? 1 : 0;
        } else {
          obj[key] = updates[key];
        }
        return obj;
      }, {} as Record<string, any>);
    
    console.log('Filtered updates:', filteredUpdates);
    
    // Build the SQL query dynamically
    const setClause = Object.keys(filteredUpdates)
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    if (!setClause) {
      console.log('No valid fields to update');
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    // Check if updated_at column exists
    try {
      const columns = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
      const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
      
      let query = `UPDATE tasks SET ${setClause}`;
      if (hasUpdatedAt) {
        query += `, updated_at = CURRENT_TIMESTAMP`;
      }
      query += ` WHERE id = @id`;
      
      console.log('SQL Query:', query);
      
      const stmt = db.prepare(query);
      
      const params = {
        ...filteredUpdates,
        id: Number(id)
      };
      console.log('Query parameters:', params);
      
      const result = stmt.run(params);
      console.log('Update result:', result);
      
      if (result.changes === 0) {
        console.log('Task not found');
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      // Fetch the updated task to return it
      try {
        const selectQuery = `
          SELECT t.*, c.name as category_name, c.color as category_color 
          FROM tasks t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.id = ?
        `;
        console.log('Select query:', selectQuery);
        
        const updatedTask = db.prepare(selectQuery).get(Number(id)) as Record<string, any>;
        console.log('Updated task:', updatedTask);
        
        // Convert numeric completed back to boolean for the API response
        if (updatedTask && typeof updatedTask === 'object' && 'completed' in updatedTask) {
          updatedTask.completed = !!updatedTask.completed;
        }
        
        return NextResponse.json(updatedTask);
      } catch (selectError) {
        console.error('Error fetching updated task:', selectError);
        // Even if we can't fetch the updated task, return success
        return NextResponse.json({ 
          id: Number(id),
          ...filteredUpdates,
          // Convert back to boolean for the response
          completed: filteredUpdates.completed ? true : false,
          success: true 
        });
      }
    } catch (dbError) {
      console.error('Database error during update:', dbError);
      return NextResponse.json({ 
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    }, { status: 500 });
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