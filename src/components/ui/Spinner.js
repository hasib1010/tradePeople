import React from 'react';
import { cn } from '@/lib/utils';

const Spinner = React.forwardRef(({ className, size = 'default', ...props }, ref) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-t-transparent border-slate-500',
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
});
Spinner.displayName = 'Spinner';

export default Spinner;