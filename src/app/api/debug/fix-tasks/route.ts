import { NextResponse } from 'next/server';
import { fixAllTaskCategories } from '@/lib/firebaseDb';

export async function GET() {
  try {
    await fixAllTaskCategories();
    return NextResponse.json({ success: true, message: 'All task categories have been fixed.' });
  } catch (error) {
    console.error('Error fixing task categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix task categories' }, 
      { status: 500 }
    );
  }
} 