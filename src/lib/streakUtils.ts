// Utility functions for calculating and managing streaks

/**
 * Represents a day's completion status
 */
interface DayCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean; // Whether all tasks for that day were completed
}

/**
 * Calculate the current streak based on task completion history
 * @param tasks - Array of tasks
 * @returns Object containing current streak and completion history
 */
export function calculateStreak(tasks: any[]): { 
  currentStreak: number;
  longestStreak: number;
  completionHistory: DayCompletion[];
} {
  // Group tasks by day
  const tasksByDay = groupTasksByDay(tasks);
  
  // Calculate completion status for each day
  const completionHistory = calculateDailyCompletions(tasksByDay);
  
  // Calculate current streak
  const currentStreak = calculateCurrentStreakDays(completionHistory);
  
  // Calculate longest streak
  const longestStreak = calculateLongestStreakDays(completionHistory);
  
  return {
    currentStreak,
    longestStreak,
    completionHistory
  };
}

/**
 * Group tasks by day
 */
function groupTasksByDay(tasks: any[]): Record<string, any[]> {
  const tasksByDay: Record<string, any[]> = {};
  
  tasks.forEach(task => {
    // Use due_date if available, otherwise use created_at
    let dateStr = task.due_date;
    if (!dateStr) {
      // Extract date part from created_at timestamp
      const createdDate = new Date(task.created_at);
      dateStr = createdDate.toISOString().split('T')[0];
    }
    
    if (!tasksByDay[dateStr]) {
      tasksByDay[dateStr] = [];
    }
    
    tasksByDay[dateStr].push(task);
  });
  
  return tasksByDay;
}

/**
 * Calculate completion status for each day
 */
function calculateDailyCompletions(tasksByDay: Record<string, any[]>): DayCompletion[] {
  const completions: DayCompletion[] = [];
  
  // Get dates from today to 365 days ago
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const tasksForDay = tasksByDay[dateStr] || [];
    
    // A day is complete if all tasks for that day are completed
    // If there are no tasks, the day is not counted as complete
    const isComplete = tasksForDay.length > 0 && 
                       tasksForDay.every(task => task.completed);
    
    completions.push({
      date: dateStr,
      completed: isComplete
    });
  }
  
  // Sort by date (oldest first)
  return completions.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate current streak (consecutive days with all tasks completed)
 */
function calculateCurrentStreakDays(completions: DayCompletion[]): number {
  // Start from today (last item) and go backwards
  const reversedCompletions = [...completions].reverse();
  
  // Check if today is complete
  if (!reversedCompletions[0]?.completed) {
    // Check if yesterday was complete (allow for one day gap)
    if (reversedCompletions[1]?.completed) {
      return 1; // Yesterday was complete, so streak is 1
    }
    return 0; // Neither today nor yesterday is complete
  }
  
  // Count consecutive completed days
  let streak = 1;
  for (let i = 1; i < reversedCompletions.length; i++) {
    if (reversedCompletions[i].completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate longest streak
 */
function calculateLongestStreakDays(completions: DayCompletion[]): number {
  let currentStreak = 0;
  let longestStreak = 0;
  
  for (const day of completions) {
    if (day.completed) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return longestStreak;
} 