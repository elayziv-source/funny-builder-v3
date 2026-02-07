
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  style,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2";
  
  // Note: We use style prop for dynamic colors from theme config
  // The className provides fallback/structure
  
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${widthStyle} ${className}`} 
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};
