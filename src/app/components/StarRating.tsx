'use client';

import { useState, useCallback } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const StarRating = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  // Size classes for stars
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  // Current size class
  const starSize = sizeClasses[size];
  
  // Handle mouse enter on a star
  const handleMouseEnter = useCallback((rating: number) => {
    if (disabled) return;
    setHoverRating(rating);
  }, [disabled]);
  
  // Handle mouse leave from rating component
  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setHoverRating(0);
  }, [disabled]);
  
  // Handle click on a star
  const handleClick = useCallback((rating: number) => {
    if (disabled) return;
    onChange(rating);
  }, [onChange, disabled]);
  
  // Render 5 stars
  return (
    <div 
      className="flex items-center gap-1" 
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className={`focus:outline-none ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          onMouseEnter={() => handleMouseEnter(rating)}
          onClick={() => handleClick(rating)}
          disabled={disabled}
          aria-label={`Rate ${rating} out of 5 stars`}
        >
          <svg
            className={`${starSize} ${
              rating <= (hoverRating || value)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } transition-colors duration-150`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default StarRating; 