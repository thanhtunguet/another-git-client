import { useState, useCallback, useRef } from 'react';

export interface UseResizablePanelOptions {
  storageKey: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
}

export function useResizablePanel({
  storageKey,
  defaultSize,
  minSize,
  maxSize,
  direction = 'horizontal',
  reverse = false
}: UseResizablePanelOptions) {
  const [size, setSizeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (Number.isFinite(parsed) && parsed >= minSize && parsed <= maxSize) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return defaultSize;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startPos: number; startSize: number } | null>(null);

  const setSize = useCallback(
    (newSize: number) => {
      const clamped = Math.max(minSize, Math.min(maxSize, newSize));
      setSizeState(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {
        // Ignore storage errors
      }
    },
    [storageKey, minSize, maxSize]
  );

  const resetSize = useCallback(() => {
    setSize(defaultSize);
  }, [defaultSize, setSize]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      dragRef.current = { startPos, startSize: size };
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - dragRef.current.startPos;
        const actualDelta = reverse ? -delta : delta;
        const calculatedSize = dragRef.current.startSize + actualDelta;
        const clamped = Math.max(minSize, Math.min(maxSize, calculatedSize));

        setSizeState(clamped);
        try {
          localStorage.setItem(storageKey, String(clamped));
        } catch {
          // Ignore
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [direction, reverse, size, minSize, maxSize, storageKey]
  );

  return {
    size,
    setSize,
    isDragging,
    handleMouseDown,
    resetSize
  };
}
