import React from 'react';
import { cn } from '@/lib/utils';

const FormLabel = React.forwardRef(({ className, htmlFor, ...props }, ref) => (
  <label
    ref={ref}
    htmlFor={htmlFor}
    className={cn('text-sm font-medium text-slate-700', className)}
    {...props}
  />
));
FormLabel.displayName = 'FormLabel';

export { FormLabel };