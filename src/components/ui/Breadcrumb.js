import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const Breadcrumb = React.forwardRef(({ className, items = [], ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-slate-500">/</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                'text-slate-600 hover:text-slate-900',
                index === items.length - 1 && 'text-slate-900 font-medium'
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'text-slate-900 font-medium',
                index < items.length - 1 && 'text-slate-600'
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
});
Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;