import * as React from 'react';

function Label({ children, htmlFor, className = '', ...props }, ref) {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export { Label };
export default React.forwardRef(Label); 