import React, { useState } from 'react';

export interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical';
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizeHandle = React.memo<ResizeHandleProps>(({
  direction = 'horizontal',
  isDragging = false,
  onMouseDown,
  onDoubleClick,
  title = 'Drag to resize panel (Double-click to reset size)',
  className = '',
  style
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isHoriz = direction === 'horizontal';
  const active = isDragging || isHovered;

  return (
    <div
      role="separator"
      tabIndex={-1}
      title={title}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`gc-resize-handle ${isHoriz ? 'horizontal' : 'vertical'} ${
        isDragging ? 'dragging' : ''
      } ${className}`.trim()}
      style={{
        flex: '0 0 auto',
        position: 'relative',
        zIndex: 15,
        cursor: isHoriz ? 'col-resize' : 'row-resize',
        userSelect: 'none',
        ...(isHoriz
          ? {
              width: '8px',
              margin: '0 -4px',
              height: '100%'
            }
          : {
              height: '8px',
              margin: '-4px 0',
              width: '100%'
            }),
        ...style
      }}
    >
      <div
        className="gc-resize-handle-line"
        style={{
          position: 'absolute',
          inset: 0,
          margin: 'auto',
          background: isDragging
            ? 'var(--color-accent)'
            : isHovered
            ? 'var(--line2)'
            : 'transparent',
          borderRadius: '2px',
          transition: 'background-color 0.12s ease',
          ...(isHoriz
            ? { width: active ? '2px' : '1px', height: '100%' }
            : { height: active ? '2px' : '1px', width: '100%' })
        }}
      />
    </div>
  );
});

ResizeHandle.displayName = 'ResizeHandle';
