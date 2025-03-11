import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-800 border border-slate-200',
      success: 'bg-green-100 text-green-800 border border-green-200',
      destructive: 'bg-red-100 text-red-800 border border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    };

    const sizes = {
      default: 'px-2.5 py-0.5 text-xs',
      sm: 'px-2 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant] || variants.default,
          sizes[size] || sizes.default,
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };