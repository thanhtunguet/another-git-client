import React from 'react';
import { useGitClient } from '../../context/GitClientContext';

export const CommandPalette: React.FC = () => {
  const { paletteOpen, closePalette, paletteQ, setPaletteQ, paletteAll } = useGitClient();

  if (!paletteOpen) return null;

  const items = paletteAll();
  const pq = paletteQ.toLowerCase();
  const filtered = items.filter(
    p => !pq || (p.group + ' ' + p.label).toLowerCase().indexOf(pq) >= 0
  );

  return (
    <div className="dialog-backdrop gc-command-palette-backdrop" onClick={closePalette}>
      <div
        className="dialog gc-command-palette"
        onClick={e => e.stopPropagation()}
      >
        <input
          value={paletteQ}
          onChange={e => setPaletteQ(e.target.value)}
          autoFocus
          placeholder="Type an action, branch, or commit…"
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
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2)' }}>
          {filtered.map((p, i) => (
            <div
              key={i}
              onClick={() => {
                closePalette();
                p.run();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '32px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: i === 0 ? 'var(--sel)' : 'transparent'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
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
