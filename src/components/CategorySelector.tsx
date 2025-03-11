'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/types/task';

interface CategorySelectorProps {
  selectedCategoryId: number | null;
  onChange: (categoryId: number | null) => void;
  includeAllOption?: boolean;
}

export default function CategorySelector({ 
  selectedCategoryId, 
  onChange,
  includeAllOption = false 
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 sm:p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
      >
        <div className="flex items-center">
          {selectedCategoryId === null && includeAllOption ? (
            <span className="text-gray-700 dark:text-gray-300">All Categories</span>
          ) : selectedCategory ? (
            <>
              <span 
                className="h-3 w-3 sm:h-4 sm:w-4 rounded-full mr-2"
                style={{ backgroundColor: selectedCategory.color || '#9ca3af' }}
              ></span>
              <span className="text-gray-700 dark:text-gray-300">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a category</span>
          )}
        </div>
        <svg className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {includeAllOption && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                selectedCategoryId === null ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              All Categories
            </button>
          )}
          
          {isLoading ? (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
              No categories found
            </div>
          ) : (
            categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedCategoryId === category.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                <div className="flex items-center">
                  <span 
                    className="h-3 w-3 sm:h-4 sm:w-4 rounded-full mr-2"
                    style={{ backgroundColor: category.color || '#9ca3af' }}
                  ></span>
                  {category.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
} 