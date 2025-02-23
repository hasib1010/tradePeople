// src/components/ui/Rating.js
"use client"

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

const Rating = React.forwardRef(({
  className,
  count = 5,
  value = 0,
  size = 'md',
  disabled = false,
  onChange,
  ...props
}, ref) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  const handleMouseEnter = (index) => {
    if (!disabled) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    setHoverRating(0);
  };
  
  const handleClick = (index) => {
    if (!disabled && onChange) {
      onChange(index);
    }
  };
  
  return (
    <div 
      className={cn(
        "inline-flex",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      ref={ref}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {[...Array(count)].map((_, index) => {
        const ratingValue = index + 1;
        const isFilled = hoverRating 
          ? ratingValue <= hoverRating 
          : ratingValue <= value;
        
        return (
          <button
            type="button"
            key={index}
            className={cn(
              "focus:outline-none transition-colors",
              !disabled && "hover:scale-110",
              disabled && "cursor-not-allowed"
            )}
            disabled={disabled}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onClick={() => handleClick(ratingValue)}
          >
            <Star 
              className={cn(
                sizeClass,
                "transition-colors",
                isFilled 
                  ? "fill-amber-400 text-amber-400" 
                  : "fill-transparent text-slate-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
});

Rating.displayName = "Rating";

export { Rating };