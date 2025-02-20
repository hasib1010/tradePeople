// src/components/ui/Select.js
export default function Select({ 
    children, 
    className = '', 
    ...props 
  }) {
    return (
      <select
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }