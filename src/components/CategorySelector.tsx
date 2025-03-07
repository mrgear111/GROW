'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types/task';

interface CategorySelectorProps {
  selectedCategoryId: number | null;
  onChange: (categoryId: number | null) => void;
}

export default function CategorySelector({ selectedCategoryId, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
      >
        {selectedCategory ? (
          <>
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedCategory.color }}
            ></span>
            <span>{selectedCategory.name}</span>
          </>
        ) : (
          <span className="text-gray-500">Select category</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              No category
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
              >
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                ></span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 