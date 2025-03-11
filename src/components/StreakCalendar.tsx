'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';

interface StreakCalendarProps {
  tasks: Task[];
}

export default function StreakCalendar({ tasks }: StreakCalendarProps) {
  const [hoverInfo, setHoverInfo] = useState<{
    date: Date;
    x: number;
    y: number;
    completedTasks: number;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const handleMouseEnter = (day: any, e: React.MouseEvent) => {
    if (!day) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverInfo({
      date: day.date,
      x: rect.left + rect.width / 2,
      y: rect.top,
      completedTasks: day.completedTasks
    });
  };
  
  const handleMouseLeave = () => {
    setHoverInfo(null);
  };
  
  // Debug log to see tasks data
  useEffect(() => {
    console.log('Tasks from database:', tasks.map(task => ({
      title: task.title,
      completed: task.completed,
      created_at: task.created_at,
      updated_at: task.updated_at
    })));
  }, [tasks]);
  
  const getTaskCompletionByDate = () => {
    const completionMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.completed) {
        // Use the actual date from updated_at without modifying the year
        const completionDate = new Date(task.updated_at);
        const dateStr = completionDate.toISOString().split('T')[0];
        
        console.log('Found completed task:', {
          title: task.title,
          date: dateStr,
          updated_at: task.updated_at
        });
        
        completionMap.set(dateStr, (completionMap.get(dateStr) || 0) + 1);
      }
    });
    
    console.log('Completion map:', Object.fromEntries(completionMap));
    return completionMap;
  };
  
  const taskCompletions = getTaskCompletionByDate();
  
  const generateCalendar = () => {
    const weeks: any[][] = [];
    const startDate = new Date(); // Use current date
    startDate.setMonth(0, 1); // Set to January 1st of current year
    
    // Get the day of week for January 1st
    const firstDayOfWeek = startDate.getDay();
    
    // Create first week with empty days before January 1st
    const firstWeek = Array(7).fill(null);
    for (let i = firstDayOfWeek; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(i - firstDayOfWeek + 1);
      const dateStr = date.toISOString().split('T')[0];
      firstWeek[i] = {
        date,
        completedTasks: taskCompletions.get(dateStr) || 0
      };
    }
    weeks.push(firstWeek);
    
    // Fill in the rest of the year
    let currentDay = new Date(startDate);
    currentDay.setDate(8 - firstDayOfWeek); // Start from the first day of second week
    
    while (currentDay.getFullYear() === startDate.getFullYear()) {
      const week = Array(7).fill(null);
      for (let i = 0; i < 7; i++) {
        if (currentDay.getFullYear() === startDate.getFullYear()) {
          const dateStr = currentDay.toISOString().split('T')[0];
          week[i] = {
            date: new Date(currentDay),
            completedTasks: taskCompletions.get(dateStr) || 0
          };
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
      weeks.push(week);
    }
    
    // Transpose the weeks array to get days in columns
    const calendar = Array(7).fill(null).map((_, dayIndex) => 
      weeks.map(week => week[dayIndex])
    );
    
    return calendar;
  };
  
  const calendar = generateCalendar();
  
  const getMonthLabels = () => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getColor = (day: any) => {
    if (!day) return '#161b22'; // Empty cell color
    
    const completedCount = day.completedTasks;
    const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    
    if (completedCount === 0) return colors[0];
    if (completedCount === 1) return colors[1];
    if (completedCount === 2) return colors[2];
    if (completedCount === 3) return colors[3];
    return colors[4];
  };
  
  // Calculate cell size based on container width
  const calculateCellSize = () => {
    // Determine how many weeks we're showing (roughly 53 weeks in a year)
    const totalWeeks = 53;
    // Account for day labels and spacing
    const availableWidth = containerWidth - 40; // 40px for day labels and some padding
    // Divide by number of weeks
    const cellSize = Math.max(10, Math.min(14, Math.floor(availableWidth / totalWeeks)));
    return cellSize;
  };
  
  const cellSize = calculateCellSize();
  const cellSpacing = Math.max(2, Math.floor(cellSize / 5));
  
  return (
    <div 
      ref={containerRef}
      className="w-full overflow-x-auto"
      style={{ 
        backgroundColor: '#0d1117', 
        padding: '20px', 
        borderRadius: '8px', 
        position: 'relative',
        minHeight: '180px'
      }}
    >
      {/* Month labels */}
      <div style={{ display: 'flex', marginBottom: '10px', marginLeft: '30px' }}>
        {getMonthLabels().map((month, index) => (
          <div 
            key={month} 
            style={{ 
              flex: '1', 
              color: '#8b949e', 
              fontSize: '14px',
              textAlign: index === 0 ? 'left' : 'center'
            }}
          >
            {month}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div style={{ display: 'flex' }}>
        {/* Days of week */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px', width: '20px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div 
              key={day}
              style={{
                height: `${cellSize}px`,
                marginBottom: `${cellSpacing}px`,
                color: '#8b949e',
                fontSize: '12px',
                textAlign: 'right',
                paddingRight: '4px',
                lineHeight: `${cellSize}px`
              }}
            >
              {index % 2 === 0 ? day[0] : ''}
            </div>
          ))}
        </div>
        
        {/* Calendar boxes */}
        <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
          {calendar[0].map((_, weekIndex) => (
            <div 
              key={weekIndex} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                marginRight: `${cellSpacing}px` 
              }}
            >
              {calendar.map((row, dayIndex) => {
                const day = row[weekIndex];
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      backgroundColor: getColor(day),
                      marginBottom: `${cellSpacing}px`,
                      cursor: day ? 'pointer' : 'default',
                      borderRadius: '2px'
                    }}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {hoverInfo && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverInfo.x}px`,
            top: `${hoverInfo.y - 10}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {formatDate(hoverInfo.date)}
          <div>
            {hoverInfo.completedTasks === 0 
              ? 'No tasks completed' 
              : `${hoverInfo.completedTasks} task${hoverInfo.completedTasks === 1 ? '' : 's'} completed`}
          </div>
        </div>
      )}
      
      {/* Color legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: '15px', 
        alignItems: 'center'
      }}>
        <span style={{ color: '#8b949e', fontSize: '12px', marginRight: '4px' }}>Less</span>
        <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#161b22', marginRight: `${cellSpacing}px`, borderRadius: '2px' }}></div>
        <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#0e4429', marginRight: `${cellSpacing}px`, borderRadius: '2px' }}></div>
        <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#006d32', marginRight: `${cellSpacing}px`, borderRadius: '2px' }}></div>
        <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#26a641', marginRight: `${cellSpacing}px`, borderRadius: '2px' }}></div>
        <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#39d353', borderRadius: '2px' }}></div>
        <span style={{ color: '#8b949e', fontSize: '12px', marginLeft: '4px' }}>More</span>
      </div>
    </div>
  );
} 