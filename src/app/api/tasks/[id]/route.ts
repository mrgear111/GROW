import { NextRequest, NextResponse } from 'next/server';
import { updateTask, deleteTask } from '@/lib/firebaseDb';

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
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);
    
    console.log('Filtered updates:', filteredUpdates);
    
    if (Object.keys(filteredUpdates).length === 0) {
      console.log('No valid fields to update');
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    try {
      const updatedTask = await updateTask(id, filteredUpdates);
      return NextResponse.json(updatedTask);
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
    console.log(`API route: Deleting task with ID: ${id}`);
    
    await deleteTask(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 