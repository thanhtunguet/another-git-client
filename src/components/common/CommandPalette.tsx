import React, { useEffect, useRef, useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';

export const CommandPalette: React.FC = () => {
  const { paletteOpen, closePalette, paletteQ, setPaletteQ, paletteAll } = useGitClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const items = paletteOpen ? paletteAll() : [];
  const pq = paletteQ.toLowerCase();
  const filtered = items.filter(
    p => !pq || (p.group + ' ' + p.label).toLowerCase().indexOf(pq) >= 0
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [paletteQ, paletteOpen]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!paletteOpen) return null;

  const runItem = (index: number) => {
    const item = filtered[index];
    if (!item) return;
    closePalette();
    item.run();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(activeIndex);
    }
  };

  return (
    <div className="dialog-backdrop gc-command-palette-backdrop" onClick={closePalette}>
      <div className="dialog gc-command-palette" onClick={e => e.stopPropagation()}>
        <input
          value={paletteQ}
          onChange={e => setPaletteQ(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
          placeholder="Type an action, branch, or commit…"
          aria-label="Command palette search"
          role="combobox"
          aria-expanded={true}
          aria-controls="gc-command-palette-listbox"
          aria-activedescendant={
            filtered[activeIndex] ? `gc-command-palette-option-${activeIndex}` : undefined
          }
          style={{
            height: '44px',
            background: 'transparent',
            border: 0,
            borderBottom: '1px solid var(--line)',
            borderRadius: 0,
            padding: '0 var(--space-4)',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--fg)',
            outline: 'none'
          }}
        />
        <div
          id="gc-command-palette-listbox"
          role="listbox"
          style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2)' }}
        >
          {filtered.map((p, i) => (
            <div
              key={i}
              id={`gc-command-palette-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              ref={el => {
                itemRefs.current[i] = el;
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => runItem(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '32px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: i === activeIndex ? 'var(--sel)' : 'transparent'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: 'var(--fg3)',
                  width: '74px',
                  flex: '0 0 auto'
                }}
              >
                {p.group}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '12.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {p.label}
              </span>
              {p.hint && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    color: 'var(--fg3)'
                  }}
                >
                  {p.hint}
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '0 var(--space-3)',
            borderTop: '1px solid var(--line)',
            fontSize: '10.5px',
            color: 'var(--fg3)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};
