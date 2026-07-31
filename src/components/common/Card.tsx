import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'sm' | 'md' | 'lg' | 'none';
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'none',
  className = '',
  children,
  ...props
}) => {
  const elevClass = elevation !== 'none' ? `elev-${elevation}` : '';

  return (
    <div className={`card ${elevClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
