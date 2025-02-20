// src/components/ui/Button.js
export default function Button({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    ...props 
  }) {
    const baseStyles = 'rounded font-medium transition-colors';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      success: 'bg-green-600 text-white hover:bg-green-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'
    };
    
    const sizes = {
      sm: 'py-1 px-3 text-sm',
      md: 'py-2 px-4 text-base',
      lg: 'py-3 px-6 text-lg'
    };
    
    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;
    
    return (
      <button
        className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }