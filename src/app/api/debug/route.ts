import { NextResponse } from 'next/server';
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    // Get all tasks
    const tasksRef = ref(db, 'tasks');
    const snapshot = await get(tasksRef);
    
    // Define the type explicitly
    const tasks: Array<{key: string, [key: string]: any}> = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const val = childSnapshot.val();
        tasks.push({ key, ...val });
      });
    }
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 