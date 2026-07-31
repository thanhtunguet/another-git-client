import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  iconOnly?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  iconOnly = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary';
  const iconClass = iconOnly ? 'btn-icon' : '';
  const blockClass = fullWidth ? 'btn-block' : '';

  return (
    <button
      className={`btn ${variantClass} ${iconClass} ${blockClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
