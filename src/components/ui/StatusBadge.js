import React from 'react';
import { cn } from '@/lib/utils';

const StatusBadge = React.forwardRef(({ className, status, ...props }, ref) => {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200', // Fallback for unknown status
        className
      )}
      {...props}
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;