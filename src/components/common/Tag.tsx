import React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'accent-2' | 'neutral' | 'outline';
  children?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) => {
  const variantClass = `tag-${variant}`;

  return (
    <span className={`tag ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};
